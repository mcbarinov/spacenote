import asyncio
import contextlib
import html
from functools import cached_property
from pathlib import Path
from typing import Any

import structlog
from pymongo.asynchronous.collection import AsyncCollection

import telegram
from spacenote.core.db import Collection
from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.counter.models import CounterType
from spacenote.core.modules.field.models import FieldValueType
from spacenote.core.modules.image import storage as image_storage
from spacenote.core.modules.note.models import Note
from spacenote.core.modules.space.models import Space
from spacenote.core.modules.telegram import bot as telegram_bot
from spacenote.core.modules.telegram.models import (
    MessageFormat,
    TelegramMirror,
    TelegramSettings,
    TelegramTask,
    TelegramTaskStatus,
    TelegramTaskType,
    TelegramTestResult,
)
from spacenote.core.modules.telegram.utils import parse_photo_directive
from spacenote.core.pagination import PaginationResult
from spacenote.core.service import Service
from spacenote.errors import NotFoundError, ValidationError
from spacenote.utils import now
from telegram.error import RetryAfter, TelegramError

logger = structlog.get_logger(__name__)

# Mirror tasks must publish to Telegram in strict per-space FIFO order. See B003 in docs/behavior.md.
MIRROR_TASK_TYPES: tuple[TelegramTaskType, ...] = (
    TelegramTaskType.MIRROR_CREATE,
    TelegramTaskType.MIRROR_UPDATE,
    TelegramTaskType.MIRROR_DELETE,
)


class _TelegramSendError(Exception):
    """Internal: a TelegramError raised by an API call where we already built request_log.

    Carries `request_log` so the worker error handler can persist it on the failed task without
    rebuilding it (the helpers know which API method was attempted). RetryAfter is never wrapped —
    it propagates as-is for outer rate-limit handling.
    """

    def __init__(self, original: TelegramError, request_log: dict[str, Any]) -> None:
        super().__init__(str(original))
        self.original = original  # underlying python-telegram-bot exception
        self.request_log = request_log  # parameters of the failed API call


class TelegramService(Service):
    """Manages Telegram integrations for spaces."""

    def __init__(self) -> None:
        self._worker_task: asyncio.Task[None] | None = None
        self._bot: telegram.Bot | None = None

    @property
    def bot(self) -> telegram.Bot:
        if self._bot is None:
            raise RuntimeError("Telegram bot not configured")
        return self._bot

    @cached_property
    def _tasks_collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.TELEGRAM_TASKS)

    @cached_property
    def _mirrors_collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.TELEGRAM_MIRRORS)

    async def on_start(self) -> None:
        """Create indexes and start worker if token configured."""
        # Tasks indexes
        await self._tasks_collection.create_index([("space_slug", 1), ("number", 1)], unique=True)
        await self._tasks_collection.create_index([("status", 1), ("created_at", 1), ("number", 1)])
        # Mirrors index
        await self._mirrors_collection.create_index([("space_slug", 1), ("note_number", 1)], unique=True)

        # Start worker if telegram bot token is configured
        if self.core.config.telegram_bot_token:
            self._bot = telegram.Bot(token=self.core.config.telegram_bot_token)
            self._worker_task = asyncio.create_task(self._run_worker())

    async def on_stop(self) -> None:
        """Stop the worker task gracefully."""
        if self._worker_task is not None:
            self._worker_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._worker_task

    async def set_activity_channel(self, slug: str, channel: str | None) -> Space:
        """Set or clear the activity channel. Independent from mirror; no validation beyond presence."""
        space = self.core.services.space.get_space(slug)
        new_settings = TelegramSettings(
            activity_channel=channel,
            mirror_channel=space.telegram.mirror_channel if space.telegram else None,
        )
        return await self._save_settings(slug, new_settings)

    async def enable_mirror(self, slug: str, channel: str) -> Space:
        """Enable mirror on a channel. Idempotent for same channel; rejects re-enable on different channel.

        See B004 in docs/behavior.md for lifecycle rules.
        """
        if not channel:
            raise ValidationError("mirror_channel must be a non-empty string")

        space = self.core.services.space.get_space(slug)
        current = space.telegram.mirror_channel if space.telegram else None

        if current == channel:
            return space  # idempotent: same channel already configured
        if current is not None:
            raise ValidationError("mirror_channel cannot be changed once set; disable mirror first")

        new_settings = TelegramSettings(
            activity_channel=space.telegram.activity_channel if space.telegram else None,
            mirror_channel=channel,
        )
        updated = await self._save_settings(slug, new_settings)
        await self._backfill_mirror(slug)
        return updated

    async def test_channel(self, slug: str, channel: str) -> TelegramTestResult:
        """Probe whether the configured bot can reach `channel`.

        Calls get_me + get_chat + send_message. Does NOT write to the DB. The test message
        stays in Telegram — the operator deletes it manually after seeing the result. Used
        as a pre-flight check from space settings UI before enabling activity/mirror.
        """
        if not channel:
            raise ValidationError("channel must be a non-empty string")
        space = self.core.services.space.get_space(slug)  # validates space exists

        bot_user = await telegram_bot.get_me(self.bot)
        bot_username = bot_user.username

        try:
            chat = await telegram_bot.get_chat(self.bot, channel)
        except TelegramError as e:
            return TelegramTestResult(
                success=False,
                chat_id=channel,
                bot_username=bot_username,
                method="getChat",
                error_class=type(e).__name__,
                error=str(e),
            )

        text = f"\U0001f916 SpaceNote connectivity test from <b>{html.escape(space.title)}</b>. You can delete this message."
        try:
            message = await telegram_bot.send_message(self.bot, channel, text)
        except TelegramError as e:
            return TelegramTestResult(
                success=False,
                chat_id=channel,
                bot_username=bot_username,
                chat_title=chat.title,
                method="sendMessage",
                error_class=type(e).__name__,
                error=str(e),
            )

        return TelegramTestResult(
            success=True,
            chat_id=channel,
            bot_username=bot_username,
            chat_title=chat.title,
            message_id=message.message_id,
        )

    async def disable_mirror(self, slug: str) -> Space:
        """Disable mirror: wipe mirror_* tasks and TelegramMirror records, then save settings.

        Idempotent if mirror is already disabled. Telegram channel itself is not modified.
        See B004 in docs/behavior.md.
        """
        space = self.core.services.space.get_space(slug)
        current = space.telegram.mirror_channel if space.telegram else None
        if current is None:
            return space  # idempotent: already disabled

        await self._wipe_mirror_state(slug)
        new_settings = TelegramSettings(
            activity_channel=space.telegram.activity_channel if space.telegram else None,
            mirror_channel=None,
        )
        return await self._save_settings(slug, new_settings)

    async def _save_settings(self, slug: str, telegram: TelegramSettings) -> Space:
        """Persist a TelegramSettings value. Stores None when both fields are empty to keep documents tidy."""
        if telegram.activity_channel is None and telegram.mirror_channel is None:
            value: dict[str, Any] | None = None
        else:
            value = telegram.model_dump()
        return await self.core.services.space.update_space_document(slug, {"$set": {"telegram": value}})

    async def _backfill_mirror(self, space_slug: str) -> None:
        """Enqueue MIRROR_CREATE for every existing note in the space, in number ASC order.

        Called by enable_mirror after the new mirror_channel is saved so that
        _enqueue_mirror_task reads it from the resolved space cache.
        """
        notes = await self.core.services.note.list_all_notes(space_slug)
        for note in notes:
            await self.notify_mirror_create(note)
        logger.info("telegram_mirror_backfill_enqueued", space_slug=space_slug, count=len(notes))

    async def _wipe_mirror_state(self, space_slug: str) -> None:
        """Delete all mirror_* tasks and TelegramMirror records for a space.

        Called by disable_mirror. Activity tasks are not touched.
        """
        tasks_result = await self._tasks_collection.delete_many(
            {
                "space_slug": space_slug,
                "task_type": {"$in": [t.value for t in MIRROR_TASK_TYPES]},
            }
        )
        mirrors_result = await self._mirrors_collection.delete_many({"space_slug": space_slug})
        logger.info(
            "telegram_mirror_state_wiped",
            space_slug=space_slug,
            tasks_deleted=tasks_result.deleted_count,
            mirrors_deleted=mirrors_result.deleted_count,
        )

    async def get_telegram_task(self, space_slug: str, number: int) -> TelegramTask:
        """Get telegram task by natural key."""
        doc = await self._tasks_collection.find_one({"space_slug": space_slug, "number": number})
        if not doc:
            raise NotFoundError(f"Telegram task {space_slug}#{number} not found")
        return TelegramTask.model_validate(doc)

    async def reset_telegram_task(self, space_slug: str, number: int) -> TelegramTask:
        """Reset a failed task back to pending so the worker retries it.

        Only `failed` tasks can be reset — pending/completed are rejected. Resets retries to 0
        and clears all diagnostics (error, error_class, request_log, response_log, attempted_at)
        so the next attempt starts fresh. For mirror tasks this also unblocks B003 ordering for
        the space (worker filters blocked spaces by failed mirror tasks).
        """
        task = await self.get_telegram_task(space_slug, number)
        if task.status != TelegramTaskStatus.FAILED:
            raise ValidationError(f"Only failed tasks can be reset; task {space_slug}#{number} is {task.status.value}")
        await self._tasks_collection.update_one(
            {"space_slug": space_slug, "number": number},
            {
                "$set": {
                    "status": TelegramTaskStatus.PENDING.value,
                    "retries": 0,
                    "error": None,
                    "error_class": None,
                    "request_log": None,
                    "response_log": None,
                    "attempted_at": None,
                }
            },
        )
        logger.info("telegram_task_reset", space_slug=space_slug, number=number, task_type=task.task_type)
        return await self.get_telegram_task(space_slug, number)

    async def list_telegram_tasks(
        self,
        space_slug: str | None = None,
        task_type: TelegramTaskType | None = None,
        status: TelegramTaskStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PaginationResult[TelegramTask]:
        """List telegram tasks with optional filters."""
        query: dict[str, Any] = {}
        if space_slug:
            query["space_slug"] = space_slug
        if task_type:
            query["task_type"] = task_type
        if status:
            query["status"] = status

        total = await self._tasks_collection.count_documents(query)
        cursor = self._tasks_collection.find(query).sort("created_at", -1).skip(offset).limit(limit)
        items = await TelegramTask.list_cursor(cursor)
        return PaginationResult(items=items, total=total, limit=limit, offset=offset)

    async def get_telegram_mirror(self, space_slug: str, note_number: int) -> TelegramMirror:
        """Get telegram mirror by natural key."""
        doc = await self._mirrors_collection.find_one({"space_slug": space_slug, "note_number": note_number})
        if not doc:
            raise NotFoundError(f"Telegram mirror {space_slug}#{note_number} not found")
        return TelegramMirror.model_validate(doc)

    async def list_telegram_mirrors(
        self, space_slug: str | None = None, limit: int = 50, offset: int = 0
    ) -> PaginationResult[TelegramMirror]:
        """List telegram mirrors with optional space filter."""
        query: dict[str, Any] = {}
        if space_slug:
            query["space_slug"] = space_slug

        total = await self._mirrors_collection.count_documents(query)
        cursor = self._mirrors_collection.find(query).sort("created_at", -1).skip(offset).limit(limit)
        items = await TelegramMirror.list_cursor(cursor)
        return PaginationResult(items=items, total=total, limit=limit, offset=offset)

    async def delete_telegram_tasks_by_space(self, space_slug: str) -> int:
        """Delete all telegram tasks for a space."""
        result = await self._tasks_collection.delete_many({"space_slug": space_slug})
        return result.deleted_count

    async def delete_telegram_mirrors_by_space(self, space_slug: str) -> int:
        """Delete all telegram mirrors for a space."""
        result = await self._mirrors_collection.delete_many({"space_slug": space_slug})
        return result.deleted_count

    # --- Activity notifications ---

    async def notify_activity_note_created(self, note: Note) -> None:
        await self._enqueue_activity_task(
            TelegramTaskType.ACTIVITY_NOTE_CREATED, note.space_slug, note.number, {"note": note.model_dump()}
        )

    async def notify_activity_note_updated(self, note: Note, changes: dict[str, tuple[Any, Any]], edited_by: str) -> None:
        await self._enqueue_activity_task(
            TelegramTaskType.ACTIVITY_NOTE_UPDATED,
            note.space_slug,
            note.number,
            {"note": note.model_dump(), "changes": changes, "edited_by": edited_by},
        )

    async def notify_activity_comment_created(
        self,
        note: Note,
        comment: Comment,
        updated_fields: dict[str, tuple[FieldValueType, FieldValueType]] | None = None,
    ) -> None:
        payload: dict[str, Any] = {"note": note.model_dump(), "comment": comment.model_dump()}
        if updated_fields:
            payload["changes"] = updated_fields
        await self._enqueue_activity_task(
            TelegramTaskType.ACTIVITY_COMMENT_CREATED,
            note.space_slug,
            note.number,
            payload,
        )

    async def _enqueue_activity_task(
        self, task_type: TelegramTaskType, space_slug: str, note_number: int, payload: dict[str, Any]
    ) -> None:
        """Create and enqueue activity notification task if channel configured."""
        space = self.core.services.space.get_space(space_slug)
        if not space.telegram or not space.telegram.activity_channel:
            return

        number = await self.core.services.counter.get_next_sequence(space_slug, CounterType.TELEGRAM_TASK)
        task = TelegramTask(
            number=number,
            task_type=task_type,
            channel_id=space.telegram.activity_channel,
            space_slug=space_slug,
            note_number=note_number,
            payload=payload,
        )
        await self._tasks_collection.insert_one(task.to_mongo())
        logger.debug("telegram_task_created", task_type=task.task_type, space_slug=space_slug, number=number)

    # --- Mirror notifications ---

    async def notify_mirror_create(self, note: Note) -> None:
        """Create task for note mirror creation."""
        await self._enqueue_mirror_task(TelegramTaskType.MIRROR_CREATE, note)

    async def notify_mirror_update(self, note: Note) -> None:
        """Create task for note mirror update."""
        await self._enqueue_mirror_task(TelegramTaskType.MIRROR_UPDATE, note)

    async def notify_mirror_delete(self, space_slug: str, note_number: int) -> None:
        """Delete mirror message for a note. Enqueues MIRROR_DELETE task and removes mirror record."""
        doc = await self._mirrors_collection.find_one({"space_slug": space_slug, "note_number": note_number})
        if not doc:
            return

        mirror = TelegramMirror.model_validate(doc)
        number = await self.core.services.counter.get_next_sequence(space_slug, CounterType.TELEGRAM_TASK)
        task = TelegramTask(
            number=number,
            task_type=TelegramTaskType.MIRROR_DELETE,
            channel_id=mirror.channel_id,
            space_slug=space_slug,
            note_number=note_number,
            payload={"message_id": mirror.message_id},
        )
        await self._tasks_collection.insert_one(task.to_mongo())
        await self._mirrors_collection.delete_one({"space_slug": space_slug, "note_number": note_number})
        logger.debug("telegram_mirror_delete_enqueued", space_slug=space_slug, note_number=note_number)

    async def _enqueue_mirror_task(self, task_type: TelegramTaskType, note: Note) -> None:
        """Create and enqueue mirror task if mirror channel configured."""
        space = self.core.services.space.get_space(note.space_slug)
        if not space.telegram or not space.telegram.mirror_channel:
            return

        number = await self.core.services.counter.get_next_sequence(note.space_slug, CounterType.TELEGRAM_TASK)
        task = TelegramTask(
            number=number,
            task_type=task_type,
            channel_id=space.telegram.mirror_channel,
            space_slug=note.space_slug,
            note_number=note.number,
            payload={"note": note.model_dump()},
        )
        await self._tasks_collection.insert_one(task.to_mongo())
        logger.debug("telegram_task_created", task_type=task.task_type, space_slug=note.space_slug, number=number)

    # --- Worker ---

    async def _run_worker(self) -> None:
        """Background worker loop."""
        logger.info("telegram_worker_started")
        while True:
            task = await self._fetch_pending_task()
            if task is None:
                await asyncio.sleep(3)  # Polling interval when queue is empty
                continue

            try:
                await self._process_task(task)
            except Exception as e:
                logger.exception("telegram_worker_unhandled_error", task_id=task.id, error=str(e))
                with contextlib.suppress(Exception):
                    await self._mark_failed(task, f"Worker error: {e}", error_class=type(e).__name__)

            await asyncio.sleep(1)  # Rate limit: max 1 msg/sec to avoid Telegram limits

    async def _fetch_pending_task(self) -> TelegramTask | None:
        """Get oldest pending task, respecting per-space mirror ordering (see B003).

        Mirror tasks are skipped while their space has any failed mirror task —
        prevents out-of-order publishing in the Telegram channel.
        """
        blocked = set(
            await self._tasks_collection.distinct(
                "space_slug",
                {"status": "failed", "task_type": {"$in": [t.value for t in MIRROR_TASK_TYPES]}},
            )
        )
        async with self._tasks_collection.find({"status": "pending"}).sort([("created_at", 1), ("number", 1)]) as cursor:
            async for doc in cursor:
                task = TelegramTask.model_validate(doc)
                if task.task_type in MIRROR_TASK_TYPES and task.space_slug in blocked:
                    continue
                return task
        return None

    async def _process_task(self, task: TelegramTask) -> None:
        """Process single task: dispatch to activity or mirror handler.

        Mirror tasks abort silently if the space's mirror_channel is no longer set or
        points to a different channel — closes the in-flight race with disable/wipe
        (the corresponding rows are already removed from _tasks_collection).
        """
        if task.task_type in MIRROR_TASK_TYPES:
            space = self.core.services.space.get_space(task.space_slug)
            current_channel = space.telegram.mirror_channel if space.telegram else None
            if current_channel != task.channel_id:
                logger.debug(
                    "telegram_mirror_task_aborted_channel_mismatch",
                    space_slug=task.space_slug,
                    number=task.number,
                    task_channel=task.channel_id,
                    current_channel=current_channel,
                )
                return

        if task.task_type == TelegramTaskType.MIRROR_DELETE:
            await self._process_mirror_delete_task(task)
        elif task.task_type in (TelegramTaskType.MIRROR_CREATE, TelegramTaskType.MIRROR_UPDATE):
            await self._process_mirror_task(task)
        else:
            await self._process_activity_task(task)

    async def _process_activity_task(self, task: TelegramTask) -> None:
        """Process activity task: render template, send to Telegram."""
        space = self.core.services.space.get_space(task.space_slug)
        template_key = f"telegram:{task.task_type}"
        text = self.core.services.template.render_telegram(space, template_key, task.payload)
        if not text:
            raise ValueError(f"No template found for {template_key}")

        request_log = {"method": "sendMessage", "chat_id": task.channel_id, "text": text, "parse_mode": "HTML"}

        try:
            message = await telegram_bot.send_message(self.bot, chat_id=task.channel_id, text=text)
            response_log = message.to_dict()
            await self._update_task(
                task, {"$set": {"status": "completed", "request_log": request_log, "response_log": response_log}}
            )
            logger.debug("telegram_task_completed", task_type=task.task_type, space_slug=task.space_slug, number=task.number)
        except RetryAfter as e:
            retry_seconds = e.retry_after if isinstance(e.retry_after, int) else e.retry_after.total_seconds()
            logger.warning("telegram_rate_limit", retry_after=retry_seconds)
            await asyncio.sleep(retry_seconds)
        except TelegramError as e:
            await self._handle_error(task, e, request_log)
        except Exception as e:
            logger.exception("telegram_task_unhandled_error", task_type=task.task_type, error=str(e))
            await self._mark_failed(task, f"Unhandled error: {e}", request_log=request_log, error_class=type(e).__name__)

    async def _process_mirror_task(self, task: TelegramTask) -> None:
        """Process mirror task: create or update Telegram message and track in mirrors collection."""
        space = self.core.services.space.get_space(task.space_slug)
        rendered = self.core.services.template.render_telegram(space, "telegram:mirror", task.payload)
        if not rendered:
            raise ValueError("No template found for telegram:mirror")

        photo_field, text = parse_photo_directive(rendered)

        photo_path: Path | None = None
        if photo_field:
            message_format = MessageFormat.PHOTO
            # Get WebP image path from note's IMAGE field
            note = task.payload["note"]
            attachment_number = note.get("fields", {}).get(photo_field)
            if attachment_number is None:
                await self._mark_failed(task, f"Photo field '{photo_field}' is empty", error_class="MissingPhotoField")
                return
            photo_path = image_storage.get_image_path(
                self.core.config.images_path, note["space_slug"], note["number"], attachment_number
            )
            if not photo_path.exists():
                await self._mark_failed(task, f"Image not found for field '{photo_field}'", error_class="MissingImageFile")
                return
        else:
            message_format = MessageFormat.TEXT

        try:
            if task.task_type == TelegramTaskType.MIRROR_CREATE:
                request_log, response_log = await self._mirror_create(task, text, message_format, photo_path)
            else:
                request_log, response_log = await self._mirror_update(task, text, photo_path)
            await self._update_task(
                task, {"$set": {"status": "completed", "request_log": request_log, "response_log": response_log}}
            )
            logger.debug("telegram_task_completed", task_type=task.task_type, space_slug=task.space_slug, number=task.number)
        except RetryAfter as e:
            retry_seconds = e.retry_after if isinstance(e.retry_after, int) else e.retry_after.total_seconds()
            logger.warning("telegram_rate_limit", retry_after=retry_seconds)
            await asyncio.sleep(retry_seconds)
        except _TelegramSendError as wrapper:
            await self._handle_error(task, wrapper.original, wrapper.request_log)
        except Exception as e:
            logger.exception("telegram_task_unhandled_error", task_type=task.task_type, error=str(e))
            await self._mark_failed(task, f"Unhandled error: {e}", error_class=type(e).__name__)

    async def _mirror_create(
        self, task: TelegramTask, text: str, message_format: MessageFormat, photo_path: Path | None
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        """Send new mirror message and create mirror record. Returns (request_log, response_log).

        Wraps non-RetryAfter TelegramError into _TelegramSendError so the worker error handler
        can persist `request_log` on the failed task.
        """
        if message_format == MessageFormat.PHOTO and photo_path:
            request_log: dict[str, Any] = {
                "method": "sendPhoto",
                "chat_id": task.channel_id,
                "caption": text,
                "photo_path": str(photo_path),
                "parse_mode": "HTML",
            }
            try:
                message = await telegram_bot.send_photo(self.bot, task.channel_id, photo_path, text)
            except RetryAfter:
                raise
            except TelegramError as e:
                raise _TelegramSendError(e, request_log) from e
        else:
            request_log = {"method": "sendMessage", "chat_id": task.channel_id, "text": text, "parse_mode": "HTML"}
            try:
                message = await telegram_bot.send_message(self.bot, task.channel_id, text)
            except RetryAfter:
                raise
            except TelegramError as e:
                raise _TelegramSendError(e, request_log) from e

        response_log = message.to_dict()

        mirror = TelegramMirror(
            space_slug=task.space_slug,
            note_number=task.note_number,
            channel_id=task.channel_id,
            message_id=message.message_id,
            message_format=message_format,
        )
        await self._mirrors_collection.insert_one(mirror.to_mongo())
        logger.debug(
            "telegram_mirror_created", space_slug=task.space_slug, note_number=task.note_number, message_id=message.message_id
        )
        return request_log, response_log

    async def _mirror_update(
        self, task: TelegramTask, text: str, photo_path: Path | None
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        """Edit existing mirror message or create new if missing. Returns (request_log, response_log)."""
        doc = await self._mirrors_collection.find_one({"space_slug": task.space_slug, "note_number": task.note_number})
        if doc:
            mirror = TelegramMirror.model_validate(doc)
            if mirror.message_format == MessageFormat.PHOTO and photo_path:
                request_log: dict[str, Any] = {
                    "method": "editMessageMedia",
                    "chat_id": task.channel_id,
                    "message_id": mirror.message_id,
                    "caption": text,
                    "photo_path": str(photo_path),
                }
                edit_call = telegram_bot.edit_photo(self.bot, task.channel_id, mirror.message_id, photo_path, text)
            else:
                request_log = {
                    "method": "editMessageText",
                    "chat_id": task.channel_id,
                    "message_id": mirror.message_id,
                    "text": text,
                    "parse_mode": "HTML",
                }
                edit_call = telegram_bot.edit_message(self.bot, task.channel_id, mirror.message_id, text)
            try:
                result = await edit_call
            except RetryAfter:
                raise
            except TelegramError as e:
                if "message to edit not found" in str(e).lower() or "message can't be edited" in str(e).lower():
                    # Mirror message was deleted in Telegram; recreate from scratch.
                    logger.warning("telegram_mirror_message_gone", space_slug=task.space_slug, note_number=task.note_number)
                    await self._mirrors_collection.delete_one({"space_slug": task.space_slug, "note_number": task.note_number})
                    return await self._mirror_create(task, text, mirror.message_format, photo_path)
                raise _TelegramSendError(e, request_log) from e
            response_log: dict[str, Any] = result.to_dict() if isinstance(result, telegram.Message) else {"unchanged": True}
            await self._mirrors_collection.update_one(
                {"space_slug": task.space_slug, "note_number": task.note_number},
                {"$set": {"updated_at": now()}},
            )
            logger.debug("telegram_mirror_updated", space_slug=task.space_slug, note_number=task.note_number)
            return request_log, response_log
        # No existing mirror, determine format from current template
        message_format = MessageFormat.PHOTO if photo_path else MessageFormat.TEXT
        return await self._mirror_create(task, text, message_format, photo_path)

    async def _process_mirror_delete_task(self, task: TelegramTask) -> None:
        """Process mirror delete task: delete Telegram message."""
        message_id = task.payload["message_id"]
        request_log = {"method": "deleteMessage", "chat_id": task.channel_id, "message_id": message_id}

        try:
            await telegram_bot.delete_message(self.bot, task.channel_id, message_id)
            await self._update_task(task, {"$set": {"status": "completed", "request_log": request_log}})
            logger.debug("telegram_mirror_deleted", space_slug=task.space_slug, note_number=task.note_number)
        except RetryAfter as e:
            retry_seconds = e.retry_after if isinstance(e.retry_after, int) else e.retry_after.total_seconds()
            logger.warning("telegram_rate_limit", retry_after=retry_seconds)
            await asyncio.sleep(retry_seconds)
        except TelegramError as e:
            if "message to delete not found" in str(e).lower():
                await self._update_task(task, {"$set": {"status": "completed", "request_log": request_log}})
                logger.debug("telegram_mirror_already_deleted", space_slug=task.space_slug, note_number=task.note_number)
            else:
                await self._handle_error(task, e, request_log)
        except Exception as e:
            logger.exception("telegram_task_unhandled_error", task_type=task.task_type, error=str(e))
            await self._mark_failed(task, f"Unhandled error: {e}", request_log=request_log, error_class=type(e).__name__)

    async def _handle_error(self, task: TelegramTask, error: Exception, request_log: dict[str, Any] | None = None) -> None:
        """Handle task error with retry logic.

        Persists structured diagnostics: error message, exception class name, and the request_log
        of the failed API call (when known) so the operator can see what was actually sent.
        """
        error_class = type(error).__name__
        if task.retries >= 3:
            await self._mark_failed(task, str(error), request_log=request_log, error_class=error_class)
            logger.error("telegram_task_failed", task_type=task.task_type, error=str(error), error_class=error_class)
        else:
            update_set: dict[str, Any] = {"status": "pending", "error": str(error), "error_class": error_class}
            if request_log is not None:
                update_set["request_log"] = request_log
            await self._update_task(task, {"$set": update_set, "$inc": {"retries": 1}})
            logger.warning(
                "telegram_task_retry",
                task_type=task.task_type,
                retries=task.retries + 1,
                error=str(error),
                error_class=error_class,
            )

    async def _mark_failed(
        self,
        task: TelegramTask,
        error: str,
        request_log: dict[str, Any] | None = None,
        error_class: str | None = None,
    ) -> None:
        """Mark task as failed with full diagnostics."""
        update_set: dict[str, Any] = {"status": "failed", "error": error, "error_class": error_class}
        if request_log is not None:
            update_set["request_log"] = request_log
        await self._update_task(task, {"$set": update_set})

    async def _update_task(self, task: TelegramTask, update: dict[str, Any]) -> None:
        """Update task by natural key."""
        await self._tasks_collection.update_one({"space_slug": task.space_slug, "number": task.number}, update)

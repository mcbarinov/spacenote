import asyncio
import contextlib
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
)
from spacenote.core.modules.telegram.utils import parse_photo_directive
from spacenote.core.pagination import PaginationResult
from spacenote.core.service import Service
from spacenote.errors import NotFoundError
from spacenote.utils import now
from telegram.error import RetryAfter, TelegramError

logger = structlog.get_logger(__name__)


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
        await self._tasks_collection.create_index([("status", 1), ("created_at", 1)])
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

    async def update_settings(self, slug: str, telegram: TelegramSettings | None) -> Space:
        """Update space telegram settings."""
        self.core.services.space.get_space(slug)
        value = telegram.model_dump() if telegram else None
        return await self.core.services.space.update_space_document(slug, {"$set": {"telegram": value}})

    async def get_telegram_task(self, space_slug: str, number: int) -> TelegramTask:
        """Get telegram task by natural key."""
        doc = await self._tasks_collection.find_one({"space_slug": space_slug, "number": number})
        if not doc:
            raise NotFoundError(f"Telegram task {space_slug}#{number} not found")
        return TelegramTask.model_validate(doc)

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
                    await self._mark_failed(task, f"Worker error: {e}")

            await asyncio.sleep(1)  # Rate limit: max 1 msg/sec to avoid Telegram limits

    async def _fetch_pending_task(self) -> TelegramTask | None:
        """Get oldest pending task."""
        doc = await self._tasks_collection.find_one({"status": "pending"}, sort=[("created_at", 1)])
        if doc:
            return TelegramTask.model_validate(doc)
        return None

    async def _process_task(self, task: TelegramTask) -> None:
        """Process single task: dispatch to activity or mirror handler."""
        if task.task_type in (TelegramTaskType.MIRROR_CREATE, TelegramTaskType.MIRROR_UPDATE):
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
            await self._handle_error(task, e)
        except Exception as e:
            logger.exception("telegram_task_unhandled_error", task_type=task.task_type, error=str(e))
            await self._mark_failed(task, f"Unhandled error: {e}")

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
                await self._mark_failed(task, f"Photo field '{photo_field}' is empty")
                return
            photo_path = image_storage.get_image_path(
                self.core.config.images_path, note["space_slug"], note["number"], attachment_number
            )
            if not photo_path.exists():
                await self._mark_failed(task, f"Image not found for field '{photo_field}'")
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
        except TelegramError as e:
            await self._handle_error(task, e)
        except Exception as e:
            logger.exception("telegram_task_unhandled_error", task_type=task.task_type, error=str(e))
            await self._mark_failed(task, f"Unhandled error: {e}")

    async def _mirror_create(
        self, task: TelegramTask, text: str, message_format: MessageFormat, photo_path: Path | None
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        """Send new mirror message and create mirror record. Returns (request_log, response_log)."""
        if message_format == MessageFormat.PHOTO and photo_path:
            request_log: dict[str, Any] = {
                "method": "sendPhoto",
                "chat_id": task.channel_id,
                "caption": text,
                "photo_path": str(photo_path),
                "parse_mode": "HTML",
            }
            message = await telegram_bot.send_photo(self.bot, task.channel_id, photo_path, text)
        else:
            request_log = {"method": "sendMessage", "chat_id": task.channel_id, "text": text, "parse_mode": "HTML"}
            message = await telegram_bot.send_message(self.bot, task.channel_id, text)

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
            try:
                if mirror.message_format == MessageFormat.PHOTO and photo_path:
                    request_log: dict[str, Any] = {
                        "method": "editMessageMedia",
                        "chat_id": task.channel_id,
                        "message_id": mirror.message_id,
                        "caption": text,
                        "photo_path": str(photo_path),
                    }
                    result = await telegram_bot.edit_photo(self.bot, task.channel_id, mirror.message_id, photo_path, text)
                else:
                    request_log = {
                        "method": "editMessageText",
                        "chat_id": task.channel_id,
                        "message_id": mirror.message_id,
                        "text": text,
                        "parse_mode": "HTML",
                    }
                    result = await telegram_bot.edit_message(self.bot, task.channel_id, mirror.message_id, text)
                response_log: dict[str, Any] = result.to_dict() if isinstance(result, telegram.Message) else {"unchanged": True}
                await self._mirrors_collection.update_one(
                    {"space_slug": task.space_slug, "note_number": task.note_number},
                    {"$set": {"updated_at": now()}},
                )
                logger.debug("telegram_mirror_updated", space_slug=task.space_slug, note_number=task.note_number)
            except TelegramError as e:
                if "message to edit not found" in str(e).lower() or "message can't be edited" in str(e).lower():
                    logger.warning("telegram_mirror_message_gone", space_slug=task.space_slug, note_number=task.note_number)
                    await self._mirrors_collection.delete_one({"space_slug": task.space_slug, "note_number": task.note_number})
                    return await self._mirror_create(task, text, mirror.message_format, photo_path)
                raise
            return request_log, response_log
        # No existing mirror, determine format from current template
        message_format = MessageFormat.PHOTO if photo_path else MessageFormat.TEXT
        return await self._mirror_create(task, text, message_format, photo_path)

    async def _handle_error(self, task: TelegramTask, error: Exception) -> None:
        """Handle task error with retry logic."""
        if task.retries >= 3:
            await self._mark_failed(task, str(error))
            logger.error("telegram_task_failed", task_type=task.task_type, error=str(error))
        else:
            await self._update_task(task, {"$set": {"status": "pending", "error": str(error)}, "$inc": {"retries": 1}})
            logger.warning("telegram_task_retry", task_type=task.task_type, retries=task.retries + 1, error=str(error))

    async def _mark_failed(self, task: TelegramTask, error: str) -> None:
        """Mark task as failed."""
        await self._update_task(task, {"$set": {"status": "failed", "error": error}})

    async def _update_task(self, task: TelegramTask, update: dict[str, Any]) -> None:
        """Update task by natural key."""
        await self._tasks_collection.update_one({"space_slug": task.space_slug, "number": task.number}, update)

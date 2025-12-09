import asyncio
import contextlib
from functools import cached_property
from typing import Any

import structlog
from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.comment.models import Comment
from spacenote.core.modules.counter.models import CounterType
from spacenote.core.modules.note.models import Note
from spacenote.core.modules.space.models import Space
from spacenote.core.modules.telegram import sender
from spacenote.core.modules.telegram.models import TelegramSettings, TelegramTask, TelegramTaskStatus, TelegramTaskType
from spacenote.core.pagination import PaginationResult
from spacenote.core.service import Service
from spacenote.errors import NotFoundError
from telegram.error import RetryAfter, TelegramError

logger = structlog.get_logger(__name__)


class TelegramService(Service):
    """Manages Telegram integrations for spaces."""

    def __init__(self) -> None:
        self._worker_task: asyncio.Task[None] | None = None

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
            self._worker_task = asyncio.create_task(self._run_worker())

    async def update_settings(self, slug: str, telegram: TelegramSettings | None) -> Space:
        """Update space telegram settings."""
        self.core.services.space.get_space(slug)
        value = telegram.model_dump() if telegram else None
        return await self.core.services.space.update_space_document(slug, {"$set": {"telegram": value}})

    async def get_task(self, space_slug: str, number: int) -> TelegramTask:
        """Get telegram task by natural key."""
        doc = await self._tasks_collection.find_one({"space_slug": space_slug, "number": number})
        if not doc:
            raise NotFoundError(f"Telegram task {space_slug}#{number} not found")
        return TelegramTask.model_validate(doc)

    async def list_tasks(
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

    # --- Activity notifications ---

    async def notify_activity_note_created(self, note: Note) -> None:
        await self._enqueue_activity_task(
            TelegramTaskType.ACTIVITY_NOTE_CREATED, note.space_slug, note.number, {"note": note.model_dump()}
        )

    async def notify_activity_note_updated(self, note: Note, changes: dict[str, tuple[Any, Any]]) -> None:
        await self._enqueue_activity_task(
            TelegramTaskType.ACTIVITY_NOTE_UPDATED, note.space_slug, note.number, {"note": note.model_dump(), "changes": changes}
        )

    async def notify_activity_comment_created(self, note: Note, comment: Comment) -> None:
        await self._enqueue_activity_task(
            TelegramTaskType.ACTIVITY_COMMENT_CREATED,
            note.space_slug,
            note.number,
            {"note": note.model_dump(), "comment": comment.model_dump()},
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

    async def notify_mirror_create(self, _note: Note) -> None:
        """Create task for note mirror creation."""
        raise NotImplementedError

    async def notify_mirror_update(self, _note: Note) -> None:
        """Create task for note mirror update."""
        raise NotImplementedError

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
        """Process single task: render template, send to Telegram."""
        space = self.core.services.space.get_space(task.space_slug)
        template_key = f"telegram:{task.task_type}"
        text = self.core.services.template.render_telegram(space, template_key, task.payload)
        if not text:
            raise ValueError(f"No template found for {template_key}")

        try:
            await sender.send_message(
                token=self.core.config.telegram_bot_token,  # type: ignore[arg-type]
                chat_id=task.channel_id,
                text=text,
            )
            await self._update_task(task, {"$set": {"status": "completed"}})
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

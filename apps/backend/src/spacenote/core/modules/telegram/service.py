from functools import cached_property
from typing import Any

import structlog
from pymongo.asynchronous.collection import AsyncCollection

from spacenote.core.db import Collection
from spacenote.core.modules.space.models import Space
from spacenote.core.modules.telegram.models import TelegramSettings
from spacenote.core.service import Service

logger = structlog.get_logger(__name__)


class TelegramService(Service):
    """Manages Telegram integrations for spaces."""

    @cached_property
    def _tasks_collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.TELEGRAM_TASKS)

    @cached_property
    def _mirrors_collection(self) -> AsyncCollection[dict[str, Any]]:
        return self.database.get_collection(Collection.TELEGRAM_MIRRORS)

    async def on_start(self) -> None:
        """Create indexes for task processing and mirror lookups."""
        # Tasks indexes
        await self._tasks_collection.create_index([("status", 1), ("created_at", 1)])
        await self._tasks_collection.create_index([("space_slug", 1), ("note_number", 1), ("task_type", 1)])
        # Mirrors index
        await self._mirrors_collection.create_index([("space_slug", 1), ("note_number", 1)], unique=True)

    async def update_settings(self, slug: str, telegram: TelegramSettings | None) -> Space:
        """Update space telegram settings."""
        self.core.services.space.get_space(slug)
        value = telegram.model_dump() if telegram else None
        return await self.core.services.space.update_space_document(slug, {"$set": {"telegram": value}})

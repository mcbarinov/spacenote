from datetime import datetime
from enum import StrEnum
from typing import Any, Literal

from pydantic import Field

from spacenote.core.db import MongoModel
from spacenote.utils import now


class TelegramTaskType(StrEnum):
    """
    Task types for Telegram integration.

    ACTIVITY_* — notifications to activity channel about events.
    MIRROR_* — sync notes to mirror channel.
    """

    ACTIVITY_NOTE_CREATED = "activity_note_created"
    ACTIVITY_NOTE_UPDATED = "activity_note_updated"
    ACTIVITY_COMMENT_CREATED = "activity_comment_created"
    MIRROR_CREATE = "mirror_create"
    MIRROR_UPDATE = "mirror_update"


class TelegramTask(MongoModel):
    """Task for Telegram message delivery. Processed by single worker."""

    task_type: TelegramTaskType
    channel_id: str = Field(description="Telegram channel ID or @username")
    space_slug: str
    note_number: int | None = None  # None for space-level events (future)
    payload: dict[str, Any] = Field(default_factory=dict, description="Context for template rendering")

    status: Literal["pending", "completed", "failed"] = "pending"
    created_at: datetime = Field(default_factory=now)
    attempted_at: datetime | None = None  # Last API call time

    retries: int = 0
    error: str | None = None  # Last error message


class TelegramMirror(MongoModel):
    """Links note to its Telegram mirror post."""

    space_slug: str
    note_number: int
    channel_id: str = Field(..., description="Telegram channel ID or @username")
    message_id: int = Field(..., description="Telegram message ID for edit_message_text")
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime | None = None

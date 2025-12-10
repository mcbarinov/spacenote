from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import Field

from spacenote.core.db import MongoModel
from spacenote.core.schema import OpenAPIModel
from spacenote.utils import now


class TelegramSettings(OpenAPIModel):
    """Telegram integration settings for a space."""

    activity_channel: str | None = Field(default=None, description="Channel for activity feed (@channel or -100...)")
    mirror_channel: str | None = Field(default=None, description="Channel for note mirroring")


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


class TelegramTaskStatus(StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class TelegramTask(MongoModel):
    """Task for Telegram message delivery. Processed by single worker."""

    number: int = Field(..., description="Sequential per space, unique with space_slug")
    task_type: TelegramTaskType = Field(..., description="Type of Telegram task")
    channel_id: str = Field(..., description="Telegram channel ID or @username")
    space_slug: str = Field(..., description="Space identifier")
    note_number: int = Field(..., description="Note number within space")
    payload: dict[str, Any] = Field(default_factory=dict, description="Context for template rendering")

    status: TelegramTaskStatus = Field(default=TelegramTaskStatus.PENDING, description="Task status")
    created_at: datetime = Field(default_factory=now, description="Creation timestamp")
    attempted_at: datetime | None = Field(default=None, description="Last API call time")

    retries: int = Field(default=0, description="Number of retry attempts")
    error: str | None = Field(default=None, description="Last error message")


class TelegramMirror(MongoModel):
    """Links note to its Telegram mirror post."""

    space_slug: str = Field(..., description="Space identifier")
    note_number: int = Field(..., description="Note number within space")
    channel_id: str = Field(..., description="Telegram channel ID or @username")
    message_id: int = Field(..., description="Telegram message ID for edit_message_text")
    created_at: datetime = Field(default_factory=now, description="Creation timestamp")
    updated_at: datetime | None = Field(default=None, description="Last sync timestamp")

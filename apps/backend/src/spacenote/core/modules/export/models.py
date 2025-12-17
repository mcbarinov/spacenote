from datetime import datetime

from pydantic import Field

from spacenote.core.modules.attachment.models import AttachmentMeta
from spacenote.core.modules.field.models import FieldValueType, SpaceField
from spacenote.core.modules.filter.models import Filter
from spacenote.core.modules.telegram.models import TelegramSettings
from spacenote.core.schema import OpenAPIModel


class SpaceExport(OpenAPIModel):
    """Space configuration for export."""

    slug: str = Field(..., description="Space identifier")
    title: str = Field(..., description="Space title")
    description: str = Field(..., description="Space description")
    members: list[str] = Field(..., description="List of member usernames")
    fields: list[SpaceField] = Field(..., description="Field definitions")
    filters: list[Filter] = Field(..., description="Filter definitions")
    hidden_fields_on_create: list[str] = Field(..., description="Fields hidden on note creation form")
    templates: dict[str, str] = Field(default_factory=dict, description="Liquid templates")
    telegram: TelegramSettings | None = Field(default=None, description="Telegram integration settings")
    created_at: datetime = Field(..., description="Creation timestamp")


class NoteExport(OpenAPIModel):
    """Note data for export."""

    number: int = Field(..., description="Note number within space")
    author: str = Field(..., description="Username of note creator")
    created_at: datetime = Field(..., description="Creation timestamp")
    edited_at: datetime | None = Field(..., description="Last edit timestamp")
    commented_at: datetime | None = Field(..., description="Last comment timestamp")
    activity_at: datetime = Field(..., description="Last activity timestamp")
    fields: dict[str, FieldValueType] = Field(..., description="Field values")


class CommentExport(OpenAPIModel):
    """Comment data for export."""

    note_number: int = Field(..., description="Note number")
    number: int = Field(..., description="Comment number within note")
    author: str = Field(..., description="Username of comment creator")
    content: str = Field(..., description="Comment text content")
    created_at: datetime = Field(..., description="Creation timestamp")
    edited_at: datetime | None = Field(..., description="Last edit timestamp")
    parent_number: int | None = Field(..., description="Parent comment number for threading")


class AttachmentExport(OpenAPIModel):
    """Attachment metadata for export."""

    note_number: int | None = Field(..., description="Note number (None = space-level)")
    number: int = Field(..., description="Attachment number")
    author: str = Field(..., description="Username")
    filename: str = Field(..., description="Original filename")
    size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    meta: AttachmentMeta = Field(..., description="Extracted file metadata")
    created_at: datetime = Field(..., description="Upload timestamp")


class ExportData(OpenAPIModel):
    """Complete space export data."""

    version: int = Field(default=1, description="Export schema version")
    exported_at: datetime = Field(..., description="Export timestamp")
    space: SpaceExport = Field(..., description="Space configuration")
    notes: list[NoteExport] | None = Field(default=None, description="Notes data")
    comments: list[CommentExport] | None = Field(default=None, description="Comments data")
    attachments: list[AttachmentExport] | None = Field(default=None, description="Attachments metadata")

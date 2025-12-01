from datetime import datetime

from pydantic import BaseModel, Field

from spacenote.core.modules.field.models import FieldValueType, SpaceField
from spacenote.core.modules.filter.models import Filter


class SpaceExport(BaseModel):
    """Space configuration for export."""

    slug: str
    title: str
    description: str
    members: list[str]
    fields: list[SpaceField]
    filters: list[Filter]
    notes_list_default_columns: list[str]
    hidden_fields_on_create: list[str]
    created_at: datetime


class NoteExport(BaseModel):
    """Note data for export."""

    number: int
    author: str
    created_at: datetime
    edited_at: datetime | None
    fields: dict[str, FieldValueType]


class CommentExport(BaseModel):
    """Comment data for export."""

    note_number: int
    number: int
    author: str
    content: str
    created_at: datetime
    edited_at: datetime | None
    parent_number: int | None


class AttachmentExport(BaseModel):
    """Attachment metadata for export."""

    note_number: int | None
    number: int
    author: str
    filename: str
    size: int
    mime_type: str
    created_at: datetime


class ExportData(BaseModel):
    """Complete space export data."""

    version: int = Field(default=1, description="Export schema version")
    exported_at: datetime
    space: SpaceExport
    notes: list[NoteExport] | None = None
    comments: list[CommentExport] | None = None
    attachments: list[AttachmentExport] | None = None

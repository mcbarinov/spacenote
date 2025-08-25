"""API schemas for web layer.

These schemas define the public API contract, separate from internal domain models.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel

from spacenote.core.field.models import FieldOption, FieldType, FieldValueType
from spacenote.core.filter.models import FilterCondition

if TYPE_CHECKING:
    from spacenote.core.field.models import SpaceField as SpaceFieldModel
    from spacenote.core.filter.models import Filter as FilterModel
    from spacenote.core.note.models import Note as NoteModel
    from spacenote.core.space.models import Space as SpaceModel
    from spacenote.core.user.models import User as UserModel


class SpaceField(BaseModel):
    """Field definition in a space schema."""

    name: str
    type: FieldType
    required: bool = False
    options: dict[FieldOption, list[str] | int | float] = {}
    default: FieldValueType | None = None

    @classmethod
    def from_core(cls, field: "SpaceFieldModel") -> "SpaceField":
        """Create from core SpaceField model."""
        return cls.model_validate(field.model_dump(mode="json"))


class Filter(BaseModel):
    """Saved filter configuration for a space."""

    name: str
    title: str
    description: str = ""
    conditions: list[FilterCondition] = []
    sort: list[str] = []
    list_fields: list[str] = []

    @classmethod
    def from_core(cls, filter_model: "FilterModel") -> "Filter":
        """Create from core Filter model."""
        return cls.model_validate(filter_model.model_dump(mode="json"))


class Space(BaseModel):
    """Container for notes with custom schema."""

    id: str
    slug: str
    title: str
    members: list[str] = []
    fields: list[SpaceField] = []
    list_fields: list[str] = []
    hidden_create_fields: list[str] = []
    filters: list[Filter] = []
    note_detail_template: str | None = None
    note_list_template: str | None = None

    @classmethod
    def from_core(cls, space: "SpaceModel") -> "Space":
        """Create from core Space model."""
        return cls.model_validate(space.model_dump(mode="json"))


class Note(BaseModel):
    """Note with custom fields stored in a space."""

    id: str
    space_id: str
    number: int
    author_id: str
    created_at: datetime
    edited_at: datetime | None = None
    fields: dict[str, FieldValueType]

    @classmethod
    def from_core(cls, note: "NoteModel") -> "Note":
        """Create from core Note model."""
        return cls.model_validate(note.model_dump(mode="json"))


class User(BaseModel):
    """User account."""

    id: str
    username: str

    @classmethod
    def from_core(cls, user: "UserModel") -> "User":
        """Create from core User model."""
        return cls.model_validate(user.model_dump(mode="json"))

"""Space models for organizing notes."""

from pydantic import BaseModel, Field

from spacenote.core.db import MongoModel, PyObjectId
from spacenote.core.field.models import SpaceField
from spacenote.core.filter.models import Filter


class SpaceTemplates(BaseModel):
    """Templates for customizing space views."""

    note_detail: str | None = None  # Liquid template for detail view
    note_list: str | None = None  # Liquid template for list items


class Space(MongoModel):
    """Container for notes with custom schema.

    Indexed on slug - unique.
    """

    slug: str  # URL-friendly unique ID
    title: str
    members: list[PyObjectId] = Field(default_factory=list)  # Users with access
    fields: list[SpaceField] = Field(default_factory=list)  # Field definitions (order matters)
    list_fields: list[str] = Field(default_factory=list)  # Default columns in list view
    hidden_create_fields: list[str] = Field(default_factory=list)  # Fields hidden in create form
    filters: list[Filter] = Field(default_factory=list)  # Saved filter configurations
    templates: SpaceTemplates = Field(default_factory=SpaceTemplates)  # Templates for customizing views

    def get_field(self, name: str) -> SpaceField | None:
        """Get field definition by name."""
        for field in self.fields:
            if field.name == name:
                return field
        return None

    def get_filter(self, name: str) -> Filter | None:
        """Get filter definition by name."""
        for filter in self.filters:
            if filter.name == name:
                return filter
        return None

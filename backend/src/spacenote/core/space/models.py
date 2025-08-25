"""Space models for organizing notes."""

from spacenote.core.db import MongoModel, PyObjectId
from spacenote.core.field.models import SpaceField
from spacenote.core.filter.models import Filter


class Space(MongoModel):
    """Container for notes with custom schema.

    Indexed on slug - unique.
    """

    slug: str  # URL-friendly unique ID
    title: str
    members: list[PyObjectId] = []  # Users with access
    fields: list[SpaceField] = []  # Field definitions (order matters)
    list_fields: list[str] = []  # Default columns in list view
    hidden_create_fields: list[str] = []  # Fields hidden in create form
    filters: list[Filter] = []  # Saved filter configurations
    note_detail_template: str | None = None  # Liquid template for detail view
    note_list_template: str | None = None  # Liquid template for list items

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

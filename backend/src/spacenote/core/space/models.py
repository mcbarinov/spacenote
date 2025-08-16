from spacenote.core.db import MongoModel, PyObjectId
from spacenote.core.field.models import SpaceField
from spacenote.core.filter.models import Filter


class Space(MongoModel):
    slug: str  # Unique identifier for the space, used in URLs
    title: str
    members: list[PyObjectId] = []  # users who have full access to this space
    fields: list[SpaceField] = []  # Custom fields, order matters for UI display
    list_fields: list[str] = []  # Default field names to show in notes list (can be overridden by filters)
    hidden_create_fields: list[str] = []  # Field names to hide in create form
    filters: list[Filter] = []  # Filter definitions for this space
    note_detail_template: str | None = None  # Liquid template for customizing note detail view
    note_list_template: str | None = None  # Liquid template for customizing note list items

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

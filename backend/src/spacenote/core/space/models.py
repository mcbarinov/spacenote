"""Space models for organizing notes."""

from pydantic import BaseModel, Field

from spacenote.core.db import MongoModel, PyObjectId
from spacenote.core.field.models import SpaceField
from spacenote.core.filter.models import Filter


class SpaceTemplates(BaseModel):
    """Templates for customizing space views."""

    note_detail: str | None = Field(None, description="Optional Liquid template for customizing note detail view")
    note_list: str | None = Field(None, description="Optional Liquid template for customizing note list item view")


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
    templates: SpaceTemplates = SpaceTemplates()  # Templates for customizing views

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


class SpaceView(BaseModel):
    """Space with custom schema for notes (API representation)."""

    slug: str = Field(..., description="URL-friendly unique identifier")
    title: str = Field(..., description="Human-readable space name")
    member_usernames: list[str] = Field(..., description="Usernames of users with access to this space")
    fields: list[SpaceField] = Field(..., description="Custom field definitions")
    list_fields: list[str] = Field(..., description="Default fields to show in note list view")
    hidden_create_fields: list[str] = Field(..., description="Fields to hide in the note creation form")
    filters: list[Filter] = Field(..., description="Predefined filter configurations")
    templates: SpaceTemplates = Field(..., description="Templates for customizing space views")

    @classmethod
    def from_domain(cls, space: Space, member_usernames: list[str]) -> "SpaceView":
        """Create view model from domain model."""
        return cls(
            slug=space.slug,
            title=space.title,
            member_usernames=member_usernames,
            fields=space.fields,
            list_fields=space.list_fields,
            hidden_create_fields=space.hidden_create_fields,
            filters=space.filters,
            templates=space.templates,
        )

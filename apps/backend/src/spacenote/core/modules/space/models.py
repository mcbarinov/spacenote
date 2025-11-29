from __future__ import annotations

from datetime import datetime

from pydantic import Field

from spacenote.core.db import MongoModel
from spacenote.core.modules.field.models import SpaceField
from spacenote.core.modules.filter.models import Filter
from spacenote.utils import SLUG_RE, now


class Space(MongoModel):
    """Space entity."""

    slug: str = Field(
        ...,
        pattern=SLUG_RE.pattern,
        description="URL-friendly unique identifier for the space (lowercase, hyphens, alphanumeric)",
    )
    title: str = Field(..., min_length=1, max_length=100, description="Space title")
    description: str = Field(default="", max_length=1000, description="Space description")
    members: list[str] = Field(default_factory=list, description="List of member usernames who have access to this space")
    fields: list[SpaceField] = Field(default_factory=list, description="Field definitions for notes in this space")
    filters: list[Filter] = Field(default_factory=list, description="Filter definitions for this space")
    created_at: datetime = Field(default_factory=now, description="Timestamp when the space was created")

    def get_field(self, name: str) -> SpaceField | None:
        """Get field definition by name."""
        for field in self.fields:
            if field.name == name:
                return field
        return None

    def get_filter(self, name: str) -> Filter | None:
        """Get filter definition by name."""
        for f in self.filters:
            if f.name == name:
                return f
        return None

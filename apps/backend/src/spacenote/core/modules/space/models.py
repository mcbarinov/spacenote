from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field, model_validator

from spacenote.core.db import MongoModel
from spacenote.core.modules.field.models import SpaceField
from spacenote.core.modules.filter.models import Filter
from spacenote.core.modules.telegram.models import TelegramSettings
from spacenote.utils import SLUG_RE, now


class Permission(StrEnum):
    ALL = "all"
    CREATE_NOTE = "create_note"
    CREATE_COMMENT = "create_comment"


class Member(BaseModel):
    username: str
    permissions: list[Permission]

    @model_validator(mode="after")
    def normalize_permissions(self) -> Member:
        """If 'all' is present, drop other permissions since 'all' implies them."""
        if Permission.ALL in self.permissions:
            self.permissions = [Permission.ALL]
        return self


class Space(MongoModel):
    """Space entity."""

    slug: str = Field(
        ...,
        pattern=SLUG_RE.pattern,
        description="URL-friendly unique identifier for the space (lowercase, hyphens, alphanumeric)",
    )
    title: str = Field(..., min_length=1, max_length=100, description="Space title")
    description: str = Field(default="", max_length=1000, description="Space description")
    members: list[Member] = Field(default_factory=list, description="Space members with permissions")
    fields: list[SpaceField] = Field(default_factory=list, description="Field definitions for notes in this space")
    filters: list[Filter] = Field(default_factory=list, description="Filter definitions for this space")
    default_filter: str = Field(default="all", description="Default filter name when ?filter= not specified")
    hidden_fields_on_create: list[str] = Field(
        default_factory=list, description="Field names to hide on note creation form (will use defaults or null)"
    )
    editable_fields_on_comment: list[str] = Field(
        default_factory=list, description="Field names that can be edited when adding a comment"
    )
    templates: dict[str, str] = Field(default_factory=dict, description="Liquid templates keyed by template identifier")
    can_transfer_to: list[str] = Field(default_factory=list, description="Space slugs where notes can be transferred to")
    telegram: TelegramSettings | None = None
    timezone: str = Field("UTC", description="Space timezone in IANA format (e.g., Atlantic/Reykjavik)")
    created_at: datetime = Field(default_factory=now, description="Timestamp when the space was created")

    def has_member(self, username: str) -> bool:
        """Check if username is a member of this space."""
        return any(m.username == username for m in self.members)

    def get_member(self, username: str) -> Member | None:
        """Get member by username."""
        for m in self.members:
            if m.username == username:
                return m
        return None

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

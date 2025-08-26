"""API schemas for web layer.

These schemas define the public API contract, separate from internal domain models.
All request/response models should be defined here for consistency and better OpenAPI documentation.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field

# Re-export enums with API documentation
from spacenote.core.field.models import FieldOption as CoreFieldOption
from spacenote.core.field.models import FieldType as CoreFieldType
from spacenote.core.field.models import FieldValueType
from spacenote.core.filter.models import FilterOperator as CoreFilterOperator

if TYPE_CHECKING:
    from spacenote.core.comment.models import Comment as CommentModel
    from spacenote.core.note.models import Note as NoteModel
    from spacenote.core.space.models import Space as SpaceModel
    from spacenote.core.user.models import User as UserModel


# Re-export enums for API use (these will appear in OpenAPI spec)
FieldType = CoreFieldType
FieldOption = CoreFieldOption
FilterOperator = CoreFilterOperator


# ============================================================================
# Error Schemas
# ============================================================================


class ErrorResponse(BaseModel):
    """Standard error response format."""

    message: str = Field(..., description="Human-readable error message")
    type: str = Field(..., description="Machine-readable error type")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"message": "Invalid credentials", "type": "authentication_error"},
                {"message": "Space not found", "type": "not_found"},
                {"message": "Access denied", "type": "access_denied"},
            ]
        }
    }


# ============================================================================
# Authentication Schemas
# ============================================================================


class LoginRequest(BaseModel):
    """Authentication request."""

    username: str = Field(..., description="Username for authentication")
    password: str = Field(..., description="Password for authentication")


class LoginResponse(BaseModel):
    """Authentication response."""

    auth_token: str = Field(..., description="Authentication token for subsequent requests")


# ============================================================================
# User Schemas
# ============================================================================


class User(BaseModel):
    """User account information."""

    id: str = Field(..., description="Unique user identifier")
    username: str = Field(..., description="Username")

    @classmethod
    def from_core(cls, user: "UserModel") -> "User":
        """Create from core User model."""
        return cls.model_validate(user.model_dump(mode="json"))


# ============================================================================
# Space Schemas
# ============================================================================


class SpaceTemplates(BaseModel):
    """Templates for customizing space views."""

    note_detail: str | None = Field(None, description="Optional Liquid template for customizing note detail view")
    note_list: str | None = Field(None, description="Optional Liquid template for customizing note list item view")


class SpaceField(BaseModel):
    """Field definition in a space schema."""

    name: str = Field(..., description="Field name (must be unique within space)")
    type: FieldType = Field(..., description="Field data type")
    required: bool = Field(False, description="Whether this field is required")
    options: dict[FieldOption, Any] = Field(
        ...,
        description="Field type-specific options (e.g., 'values' for string_choice, 'min'/'max' for numeric types)",
    )
    default: FieldValueType = Field(None, description="Default value for this field")


class FilterCondition(BaseModel):
    """Single filter condition for querying notes."""

    field: str = Field(..., description="Field name to filter on")
    operator: FilterOperator = Field(..., description="Comparison operator")
    value: FieldValueType = Field(..., description="Value to compare against")


class Filter(BaseModel):
    """Saved filter configuration for a space."""

    name: str = Field(..., description="Unique filter identifier within the space")
    title: str = Field(..., description="Display name for the filter")
    description: str = Field("", description="Optional description of what this filter shows")
    conditions: list[FilterCondition] = Field(default_factory=list, description="Filter conditions (combined with AND)")
    sort: list[str] = Field(
        default_factory=list,
        description="Sort order - field names with optional '-' prefix for descending",
    )
    list_fields: list[str] = Field(default_factory=list, description="Fields to display in list view when this filter is active")


class Space(BaseModel):
    """Container for notes with custom schema."""

    id: str = Field(..., description="Unique space identifier")
    slug: str = Field(..., description="URL-friendly unique identifier")
    title: str = Field(..., description="Human-readable space name")
    members: list[str] = Field(..., description="User IDs with access to this space")
    fields: list[SpaceField] = Field(..., description="Custom field definitions")
    list_fields: list[str] = Field(..., description="Default fields to show in note list view")
    hidden_create_fields: list[str] = Field(..., description="Fields to hide in the note creation form")
    filters: list[Filter] = Field(..., description="Predefined filter configurations")
    templates: SpaceTemplates = Field(..., description="Templates for customizing space views")

    @classmethod
    def from_core(cls, space: "SpaceModel") -> "Space":
        """Create from core Space model."""
        return cls.model_validate(space.model_dump(mode="json"))


class CreateSpaceRequest(BaseModel):
    """Request to create a new space."""

    slug: str = Field(
        ...,
        description="URL-friendly unique identifier (lowercase letters, numbers, hyphens; no leading/trailing/double hyphens)",
        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    title: str = Field(..., description="Human-readable space name")

    model_config = {"json_schema_extra": {"examples": [{"slug": "my-tasks", "title": "My Task Tracker"}]}}


class UpdateSpaceMembersRequest(BaseModel):
    """Request to update space members."""

    usernames: list[str] = Field(..., description="List of usernames to set as space members")

    model_config = {"json_schema_extra": {"examples": [{"usernames": ["alice", "bob", "charlie"]}]}}


# ============================================================================
# Note Schemas
# ============================================================================


class Note(BaseModel):
    """Note with custom fields stored in a space."""

    id: str = Field(..., description="Unique note identifier")
    space_id: str = Field(..., description="ID of the space containing this note")
    number: int = Field(..., description="Sequential number within the space")
    author_id: str = Field(..., description="ID of the user who created this note")
    created_at: datetime = Field(..., description="When the note was created")
    edited_at: datetime | None = Field(None, description="When the note was last edited")
    fields: dict[str, FieldValueType] = Field(..., description="Field values as defined by the space schema")

    @classmethod
    def from_core(cls, note: "NoteModel") -> "Note":
        """Create from core Note model."""
        return cls.model_validate(note.model_dump(mode="json"))


class CreateNoteRequest(BaseModel):
    """Request to create a new note."""

    raw_fields: dict[str, str] = Field(
        ...,
        description="Field values as raw strings (will be parsed according to field types)",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "raw_fields": {
                        "title": "Complete API documentation",
                        "description": "Add comprehensive OpenAPI documentation",
                        "status": "in_progress",
                        "priority": "high",
                    }
                }
            ]
        }
    }


# ============================================================================
# Comment Schemas
# ============================================================================


class Comment(BaseModel):
    """Comment on a note."""

    id: str = Field(..., description="Unique comment identifier")
    note_id: str = Field(..., description="ID of the note being commented on")
    author_id: str = Field(..., description="ID of the user who wrote this comment")
    number: int = Field(..., description="Sequential number within the note's comments")
    content: str = Field(..., description="The comment text")
    created_at: datetime = Field(..., description="When the comment was created")

    @classmethod
    def from_core(cls, comment: "CommentModel") -> "Comment":
        """Create from core Comment model."""
        return cls.model_validate(comment.model_dump(mode="json"))


class CreateCommentRequest(BaseModel):
    """Request to create a new comment."""

    content: str = Field(..., description="The comment text", min_length=1)

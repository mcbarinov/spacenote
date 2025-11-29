from pydantic import BaseModel, Field


class Filter(BaseModel):
    """Filter definition for a space."""

    name: str = Field(..., description="Filter identifier (must be unique within space)")
    display_fields: list[str] = Field(default_factory=list, description="Field names to show in list view")

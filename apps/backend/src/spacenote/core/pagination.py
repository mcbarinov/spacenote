from pydantic import BaseModel, Field


class PaginationResult[T](BaseModel):
    """Pagination result wrapper for list endpoints."""

    items: list[T] = Field(..., description="List of items in current page")
    total: int = Field(..., description="Total number of items across all pages", ge=0)
    limit: int = Field(..., description="Maximum items per page", ge=1)
    offset: int = Field(..., description="Number of items skipped", ge=0)

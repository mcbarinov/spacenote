"""API schemas for web layer.

This file contains only shared schemas.
Request/response models are defined in their respective routers.
"""

from pydantic import BaseModel, Field


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

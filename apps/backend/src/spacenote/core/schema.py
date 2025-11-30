from pydantic import BaseModel, ConfigDict


class OpenAPIModel(BaseModel):
    """Base model for API schemas with unified OpenAPI output."""

    model_config = ConfigDict(
        # Without: separate MyModel-Input and MyModel-Output schemas when model used in both contexts.
        # With: single MyModel schema for both request and response.
        json_schema_mode_override="serialization",
        # Without: fields with defaults (e.g. items: list = []) marked as optional (items?: ...).
        # With: all fields required, no need for ?. operators in TypeScript.
        json_schema_serialization_defaults_required=True,
    )

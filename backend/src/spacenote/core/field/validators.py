from spacenote.core.errors import ValidationError
from spacenote.core.field.models import FieldOption, FieldType, SpaceField


def validate_space_field(field: SpaceField) -> SpaceField:
    """Validate and potentially transform a SpaceField.

    Returns a validated (and possibly modified) SpaceField.
    Future-proofed for type transformations like Decimal support.
    """
    # Validate field name format
    if not field.name or not field.name.replace("_", "").isalnum():
        raise ValidationError(f"Invalid field name: {field.name}")

    # Validate options match field type
    if field.type == FieldType.STRING_CHOICE:
        if FieldOption.VALUES not in field.options:
            raise ValidationError("String choice fields must have 'values' option")
        values = field.options[FieldOption.VALUES]
        if not isinstance(values, list) or not all(isinstance(v, str) for v in values):
            raise ValidationError("String choice 'values' must be a list of strings")

    if field.type in (FieldType.INT, FieldType.FLOAT):
        for opt in (FieldOption.MIN, FieldOption.MAX):
            if opt in field.options:
                val = field.options[opt]
                if not isinstance(val, (int, float)):
                    raise ValidationError(f"{opt} must be numeric")

    # Validate default value matches field type
    if field.default is not None:
        # Type-specific default validation
        if field.type == FieldType.BOOLEAN and not isinstance(field.default, bool):
            raise ValidationError("Boolean field default must be boolean")
        if field.type == FieldType.TAGS and not isinstance(field.default, list):
            raise ValidationError("Tags field default must be list")

    # Return validated field (potentially modified in future)
    return field

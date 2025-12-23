import re

PHOTO_DIRECTIVE_PATTERN = re.compile(r"^\{#\s*photo:\s*(\w+)\s*#\}")


def parse_photo_directive(template: str) -> tuple[str | None, str]:
    """Parse photo directive from template.

    Returns (field_name, clean_template) if directive found, else (None, template).
    """
    lines = template.split("\n", 1)
    match = PHOTO_DIRECTIVE_PATTERN.match(lines[0].strip())
    if match:
        field_name = match.group(1)
        clean_template = lines[1] if len(lines) > 1 else ""
        return field_name, clean_template.lstrip("\n")
    return None, template

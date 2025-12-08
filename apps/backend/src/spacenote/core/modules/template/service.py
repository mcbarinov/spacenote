import structlog
from liquid import Template
from liquid.exceptions import LiquidError

from spacenote.core.modules.note.models import Note
from spacenote.core.modules.space.models import Space
from spacenote.core.service import Service
from spacenote.errors import ValidationError

logger = structlog.get_logger(__name__)

DEFAULT_TITLE_TEMPLATE = "Note #{{ note.number }}"


class TemplateService(Service):
    """Service for template management."""

    async def set_template(self, slug: str, key: str, content: str) -> Space:
        """Set or remove a template for the space. Empty content removes the template."""
        space = self.core.services.space.get_space(slug)

        # Validate template key
        if key == "note:title":
            # Validate Liquid syntax for note:title templates
            if content.strip():
                try:
                    Template(content)
                except LiquidError as e:
                    raise ValidationError(f"Invalid Liquid template syntax: {e}") from e
        elif key == "web:note:detail":
            pass
        elif key.startswith("web:note:list:"):
            filter_name = key.removeprefix("web:note:list:")
            if not filter_name or space.get_filter(filter_name) is None:
                raise ValidationError(f"Filter '{filter_name}' not found")
        elif key == "web_react:note:detail":
            pass
        elif key.startswith("web_react:note:list:"):
            filter_name = key.removeprefix("web_react:note:list:")
            if not filter_name or space.get_filter(filter_name) is None:
                raise ValidationError(f"Filter '{filter_name}' not found")
        else:
            raise ValidationError(f"Invalid template key: {key}")

        # Empty content = remove template
        if not content.strip():
            space = await self.core.services.space.update_space_document(slug, {"$unset": {f"templates.{key}": ""}})
            logger.debug("template_removed", space_slug=slug, key=key)
        else:
            space = await self.core.services.space.update_space_document(slug, {"$set": {f"templates.{key}": content}})
            logger.debug("template_set", space_slug=slug, key=key)

        return space

    def render_note_title(self, space: Space, note: Note) -> str:
        """Render note title from template."""
        template_str = space.templates.get("note:title", DEFAULT_TITLE_TEMPLATE)
        try:
            template = Template(template_str)
            return template.render(note=note.model_dump(), space=space.model_dump())
        except LiquidError:
            logger.warning("template_render_error", space_slug=space.slug, note_number=note.number)
            return f"Note #{note.number}"

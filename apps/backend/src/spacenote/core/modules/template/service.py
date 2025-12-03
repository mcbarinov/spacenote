import structlog

from spacenote.core.modules.space.models import Space
from spacenote.core.service import Service
from spacenote.errors import ValidationError

logger = structlog.get_logger(__name__)


class TemplateService(Service):
    """Service for template management."""

    async def set_template(self, slug: str, key: str, content: str) -> Space:
        """Set or remove a template for the space. Empty content removes the template."""
        space = self.core.services.space.get_space(slug)

        # Validate template key
        if key != "web:note:detail":
            if not key.startswith("web:note:list:"):
                raise ValidationError(f"Invalid template key: {key}")
            filter_name = key.removeprefix("web:note:list:")
            if not filter_name or space.get_filter(filter_name) is None:
                raise ValidationError(f"Filter '{filter_name}' not found")

        # Empty content = remove template
        if not content.strip():
            space = await self.core.services.space.update_space_document(slug, {"$unset": {f"templates.{key}": ""}})
            logger.debug("template_removed", space_slug=slug, key=key)
        else:
            space = await self.core.services.space.update_space_document(slug, {"$set": {f"templates.{key}": content}})
            logger.debug("template_set", space_slug=slug, key=key)

        return space

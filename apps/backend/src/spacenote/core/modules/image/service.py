import asyncio
from typing import Any

import structlog
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.core.modules.attachment import storage as attachment_storage
from spacenote.core.modules.field.models import FieldOption, FieldType
from spacenote.core.modules.image import storage as image_storage
from spacenote.core.modules.image.processor import WebpOptions, create_webp_image
from spacenote.core.service import Service
from spacenote.errors import ValidationError

logger = structlog.get_logger(__name__)


class ImageService(Service):
    """Handles IMAGE field processing and WebP generation."""

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        super().__init__(database)
        self._background_tasks: set[asyncio.Task[Any]] = set()

    async def on_start(self) -> None:
        """Ensure images directory exists."""
        image_storage.ensure_images_dir(self.core.config.images_path)

    async def process_image_fields(self, space_slug: str, note_number: int, image_fields: dict[str, int]) -> dict[str, int]:
        """Process IMAGE fields: finalize pending attachments and schedule WebP generation.

        Args:
            image_fields: dict of field_name -> pending_number (only IMAGE fields with values)

        Returns: dict of field_name -> attachment_number
        """
        space = self.core.services.space.get_space(space_slug)
        field_options = {f.name: f.options for f in space.fields if f.type == FieldType.IMAGE}
        result: dict[str, int] = {}

        for field_name, pending_number in image_fields.items():
            attachment = await self.core.services.attachment.finalize_pending(pending_number, space_slug, note_number)
            result[field_name] = attachment.number

            max_width_opt = field_options.get(field_name, {}).get(FieldOption.MAX_WIDTH)
            max_width = int(max_width_opt) if isinstance(max_width_opt, (int, float)) else None
            self._schedule_image_generation(space_slug, note_number, attachment.number, max_width)

        return result

    def _schedule_image_generation(
        self, space_slug: str, note_number: int, attachment_number: int, max_width: int | None
    ) -> None:
        """Schedule background task for WebP image generation."""
        task = asyncio.create_task(self._generate_image(space_slug, note_number, attachment_number, max_width))
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)

    async def _generate_image(self, space_slug: str, note_number: int, attachment_number: int, max_width: int | None) -> None:
        """Generate WebP image in background."""
        try:
            source_path = attachment_storage.get_attachment_file_path(
                self.core.config.attachments_path, space_slug, note_number, attachment_number
            )

            webp_content = await create_webp_image(source_path, max_width)

            image_storage.write_image(self.core.config.images_path, space_slug, note_number, attachment_number, webp_content)

            logger.info("image_generated", space_slug=space_slug, note_number=note_number, attachment_number=attachment_number)
        except Exception:
            logger.exception(
                "image_generation_failed", space_slug=space_slug, note_number=note_number, attachment_number=attachment_number
            )

    async def get_attachment_as_webp(
        self, space_slug: str | None, note_number: int | None, attachment_number: int, options: WebpOptions
    ) -> bytes:
        """Convert attachment to WebP format on-the-fly.

        Args:
            space_slug: Space slug, or None for pending attachment
            note_number: Note number (ignored if space_slug is None)
            attachment_number: Attachment number
            options: WebP conversion options
        """
        if space_slug is None:
            pending = await self.core.services.attachment.get_pending_attachment(attachment_number)
            if not pending.mime_type.startswith("image/"):
                raise ValidationError(f"Pending attachment {attachment_number} is not an image")
            file_path = attachment_storage.get_pending_attachment_path(self.core.config.attachments_path, attachment_number)
        else:
            attachment = await self.core.services.attachment.get_attachment(space_slug, note_number, attachment_number)
            if not attachment.mime_type.startswith("image/"):
                raise ValidationError(f"Attachment {attachment_number} is not an image")
            file_path = attachment_storage.get_attachment_file_path(
                self.core.config.attachments_path, space_slug, note_number, attachment_number
            )

        return await create_webp_image(file_path, options.max_width)

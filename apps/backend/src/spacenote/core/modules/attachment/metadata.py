import asyncio
import logging
from pathlib import Path

from PIL import Image

from spacenote.core.modules.attachment.models import AttachmentMeta, ImageMeta
from spacenote.core.modules.image.exif import extract_exif, parse_exif_datetime

logger = logging.getLogger(__name__)

_IMAGE_MIME_TYPES = frozenset(
    [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/tiff",
        "image/heic",
        "image/heif",
    ]
)


async def extract_metadata(file_path: Path, mime_type: str) -> AttachmentMeta:
    """Extract metadata from file."""
    if mime_type in _IMAGE_MIME_TYPES:
        return await _extract_image_metadata(file_path)
    return AttachmentMeta()


async def _extract_image_metadata(file_path: Path) -> AttachmentMeta:
    """Extract metadata from image file."""
    try:
        return await asyncio.to_thread(_extract_image_metadata_sync, file_path)
    except Exception as e:
        logger.exception("Failed to extract image metadata from %s", file_path)
        return AttachmentMeta(error=str(e))


def _extract_image_metadata_sync(file_path: Path) -> AttachmentMeta:
    """Sync implementation for image metadata extraction."""
    with Image.open(file_path) as img:
        image_meta = ImageMeta(width=img.width, height=img.height, format=img.format)

    exif_data = extract_exif(file_path)
    if exif_data:
        exif_created_at = parse_exif_datetime(exif_data)
        if exif_created_at:
            image_meta.exif_created_at = exif_created_at
        return AttachmentMeta(image=image_meta, exif=exif_data)

    return AttachmentMeta(image=image_meta)

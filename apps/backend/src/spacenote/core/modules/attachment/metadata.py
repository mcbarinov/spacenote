import asyncio
import logging
from pathlib import Path
from typing import Any

from PIL import Image

from spacenote.core.modules.image.exif import extract_exif

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


async def extract_metadata(file_path: Path, mime_type: str) -> dict[str, Any]:
    """Extract metadata from file. Returns {} for unsupported formats."""
    if mime_type in _IMAGE_MIME_TYPES:
        return await _extract_image_metadata(file_path)
    return {}


async def _extract_image_metadata(file_path: Path) -> dict[str, Any]:
    """Extract metadata from image file."""
    try:
        return await asyncio.to_thread(_extract_image_metadata_sync, file_path)
    except Exception as e:
        logger.exception("Failed to extract image metadata from %s", file_path)
        return {"error": str(e)}


def _extract_image_metadata_sync(file_path: Path) -> dict[str, Any]:
    """Sync implementation for image metadata extraction."""
    result: dict[str, Any] = {}

    with Image.open(file_path) as img:
        result["image"] = {
            "width": img.width,
            "height": img.height,
            "format": img.format,
        }

    exif_data = extract_exif(file_path)
    if exif_data:
        result["exif"] = exif_data

    return result

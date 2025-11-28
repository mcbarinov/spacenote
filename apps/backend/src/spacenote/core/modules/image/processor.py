import asyncio
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

import pillow_heif
from PIL import Image

from spacenote.errors import ValidationError

pillow_heif.register_heif_opener()


@dataclass
class WebpOptions:
    max_width: int | None = None


def parse_webp_option(option: str | None) -> WebpOptions:
    if option is None:
        return WebpOptions()

    parts = option.split(":")
    if len(parts) != 2:
        raise ValidationError(f"Invalid option format: '{option}' (expected 'key:value')")

    key, value = parts

    if key == "max_width":
        try:
            max_width = int(value)
        except ValueError:
            raise ValidationError(f"Invalid max_width value: '{value}' (expected integer)") from None
        if max_width <= 0:
            raise ValidationError(f"max_width must be positive, got: {max_width}")
        return WebpOptions(max_width=max_width)

    raise ValidationError(f"Unknown option: '{key}' (supported: max_width)")


async def create_webp_image(source: Path, max_width: int | None) -> bytes:
    """Convert image to WebP format, resize if max_width set.

    Runs PIL operations in executor to avoid blocking event loop.
    """

    def _process() -> bytes:
        img: Image.Image = Image.open(source)

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        if max_width is not None and img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        output = BytesIO()
        img.save(output, format="WEBP", quality=85)
        return output.getvalue()

    return await asyncio.to_thread(_process)

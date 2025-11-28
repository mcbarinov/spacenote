import asyncio
from io import BytesIO
from pathlib import Path

from PIL import Image


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

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _process)

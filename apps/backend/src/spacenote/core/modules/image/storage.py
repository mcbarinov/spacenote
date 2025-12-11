import shutil
from pathlib import Path


def get_image_path(images_path: str, space_slug: str, note_number: int, attachment_number: int) -> Path:
    """Get path to WebP image file."""
    base = Path(images_path).resolve()
    result = base / space_slug / str(note_number) / str(attachment_number)
    if not result.resolve().is_relative_to(base):
        raise ValueError("Invalid image path")
    return result


def write_image(images_path: str, space_slug: str, note_number: int, attachment_number: int, content: bytes) -> Path:
    """Write WebP image to disk."""
    path = get_image_path(images_path, space_slug, note_number, attachment_number)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return path


def read_image(images_path: str, space_slug: str, note_number: int, attachment_number: int) -> bytes:
    """Read WebP image from disk."""
    return get_image_path(images_path, space_slug, note_number, attachment_number).read_bytes()


def ensure_images_dir(images_path: str) -> None:
    """Ensure images directory exists."""
    Path(images_path).mkdir(parents=True, exist_ok=True)


def delete_space_dir(images_path: str, space_slug: str) -> None:
    """Delete entire space images directory."""
    base = Path(images_path).resolve()
    path = base / space_slug
    if not path.resolve().is_relative_to(base):
        raise ValueError("Invalid image path")
    if path.exists():
        shutil.rmtree(path)

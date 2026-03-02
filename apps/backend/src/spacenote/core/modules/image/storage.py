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


def copy_image(images_path: str, src_slug: str, src_note: int, src_att: int, dst_slug: str, dst_note: int, dst_att: int) -> None:
    """Copy image file from one location to another."""
    src = get_image_path(images_path, src_slug, src_note, src_att)
    if not src.exists():
        return
    dst = get_image_path(images_path, dst_slug, dst_note, dst_att)
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def ensure_images_dir(images_path: str) -> None:
    """Ensure images directory exists."""
    Path(images_path).mkdir(parents=True, exist_ok=True)


def rename_space_dir(images_path: str, old_slug: str, new_slug: str) -> None:
    """Rename space images directory."""
    base = Path(images_path).resolve()
    old_path = base / old_slug
    new_path = base / new_slug
    if not old_path.resolve().is_relative_to(base) or not new_path.resolve().is_relative_to(base):
        raise ValueError("Invalid image path")
    if old_path.exists():
        old_path.rename(new_path)


def delete_note_dir(images_path: str, space_slug: str, note_number: int) -> None:
    """Delete all images for a note."""
    base = Path(images_path).resolve()
    note_dir = base / space_slug / str(note_number)
    if note_dir.exists() and note_dir.resolve().is_relative_to(base):
        shutil.rmtree(note_dir)


def delete_space_dir(images_path: str, space_slug: str) -> None:
    """Delete entire space images directory."""
    base = Path(images_path).resolve()
    path = base / space_slug
    if not path.resolve().is_relative_to(base):
        raise ValueError("Invalid image path")
    if path.exists():
        shutil.rmtree(path)

import shutil
from pathlib import Path

SPACE_ATTACHMENTS_DIR = "__space__"


def get_pending_attachments_path(attachments_path: Path) -> Path:
    """Get path to pending attachments directory."""
    return attachments_path / "pending"


def get_pending_attachment_path(attachments_path: Path, number: int) -> Path:
    """Get path to a pending attachment file."""
    return get_pending_attachments_path(attachments_path) / str(number)


def write_pending_attachment_file(attachments_path: Path, number: int, content: bytes) -> Path:
    """Write pending attachment file to disk."""
    file_path = get_pending_attachment_path(attachments_path, number)
    file_path.write_bytes(content)
    return file_path


def ensure_pending_attachments_dir(attachments_path: Path) -> None:
    """Ensure pending directory exists."""
    get_pending_attachments_path(attachments_path).mkdir(parents=True, exist_ok=True)


def get_attachment_dir(attachments_path: Path, space_slug: str, note_number: int | None) -> Path:
    """Get directory for attachments (note-level or space-level)."""
    base = attachments_path.resolve()
    subdir = str(note_number) if note_number is not None else SPACE_ATTACHMENTS_DIR
    result = base / space_slug / subdir
    # Prevent path traversal attacks (e.g., space_slug="../../../etc" escaping base directory)
    if not result.resolve().is_relative_to(base):
        raise ValueError("Invalid attachment path")
    return result


def get_attachment_file_path(attachments_path: Path, space_slug: str, note_number: int | None, number: int) -> Path:
    """Get path to an attachment file."""
    return get_attachment_dir(attachments_path, space_slug, note_number) / str(number)


def write_attachment_file(attachments_path: Path, space_slug: str, note_number: int | None, number: int, content: bytes) -> Path:
    """Write attachment file to disk."""
    file_path = get_attachment_file_path(attachments_path, space_slug, note_number, number)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)
    return file_path


def read_pending_attachment_file(attachments_path: Path, number: int) -> bytes:
    """Read pending attachment file from disk."""
    return get_pending_attachment_path(attachments_path, number).read_bytes()


def delete_pending_attachment_file(attachments_path: Path, number: int) -> None:
    """Delete pending attachment file from disk."""
    path = get_pending_attachment_path(attachments_path, number)
    if path.exists():
        path.unlink()


def read_attachment_file(attachments_path: Path, space_slug: str, note_number: int | None, number: int) -> bytes:
    """Read attachment file from disk."""
    return get_attachment_file_path(attachments_path, space_slug, note_number, number).read_bytes()


def move_pending_to_attachment(
    attachments_path: Path, pending_number: int, space_slug: str, note_number: int, attachment_number: int
) -> Path:
    """Move pending attachment file to permanent attachment location."""
    src = get_pending_attachment_path(attachments_path, pending_number)
    dst = get_attachment_file_path(attachments_path, space_slug, note_number, attachment_number)
    dst.parent.mkdir(parents=True, exist_ok=True)
    src.rename(dst)
    return dst


def copy_attachment_file(
    attachments_path: Path, src_slug: str, src_note: int, src_num: int, dst_slug: str, dst_note: int, dst_num: int
) -> None:
    """Copy attachment file from one location to another."""
    src = get_attachment_file_path(attachments_path, src_slug, src_note, src_num)
    if not src.exists():
        return
    dst = get_attachment_file_path(attachments_path, dst_slug, dst_note, dst_num)
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def rename_space_dir(attachments_path: Path, old_slug: str, new_slug: str) -> None:
    """Rename space attachments directory."""
    base = attachments_path.resolve()
    old_path = base / old_slug
    new_path = base / new_slug
    if not old_path.resolve().is_relative_to(base) or not new_path.resolve().is_relative_to(base):
        raise ValueError("Invalid attachment path")
    if old_path.exists():
        old_path.rename(new_path)


def delete_space_dir(attachments_path: Path, space_slug: str) -> None:
    """Delete entire space attachments directory."""
    base = attachments_path.resolve()
    path = base / space_slug
    if not path.resolve().is_relative_to(base):
        raise ValueError("Invalid attachment path")
    if path.exists():
        shutil.rmtree(path)

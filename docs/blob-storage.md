# Blob Storage Refactor — Branch Working Doc

Lifetime of branch `feat/blob-storage`. Stays in `main` after merge.

## TL;DR

Replacing the dual-storage attachment/image pipeline with a single content-addressed Blob layer. `Field.IMAGE` and `Attachment` become independent consumers of `Blob`; the WebP-variant tree, the `pending_attachments` collection, and the `attachments/{space}/{note}/{number}` directory layout are all removed.

Design is canonical in **[issue #70](https://github.com/mcbarinov/spacenote/issues/70)** — do not duplicate design content here. This doc tracks branch-local execution: what was removed, what was learned, and (post-merge) how to migrate production data.

## Removed in this branch

Pre-merge grep target. Nothing on this list should still appear in the code. Step 6 verifies.

### Backend modules
- [ ] `apps/backend/src/spacenote/core/modules/attachment/` — old `Attachment` + `PendingAttachment` (rewritten in Step 4)
- [ ] `apps/backend/src/spacenote/core/modules/image/` — entire WebP generation pipeline (`exif.py`, `processor.py`, `service.py`, `storage.py`)

### Routers
- [ ] `apps/backend/src/spacenote/web/routers/attachments.py` (covers note + space + pending attachments)
- [ ] `apps/backend/src/spacenote/web/routers/images.py`
- [ ] Router registration entries in `apps/backend/src/spacenote/web/routers/__init__.py`

### App-layer methods
- [ ] `App.read_pending_attachment_file` and other attachment/image read/write entry points in `apps/backend/src/spacenote/app.py`

### Mongo collections
- [ ] `attachments` (collection + `Collection.ATTACHMENTS` enum value in `core/db.py`)
- [ ] `pending_attachments` (collection + `Collection.PENDING_ATTACHMENTS` enum value in `core/db.py`)

### Config / data_dir paths
- [ ] `Config.attachments_path` → `{data_dir}/attachments/`
- [ ] `Config.images_path` → `{data_dir}/images/`
- [ ] `{data_dir}/attachments/pending/` (the pending subtree)
- [ ] The `__space__` filename hack (`SPACE_ATTACHMENTS_DIR` constant in `attachment/storage.py`)

### Symbol-level grep targets (must return zero hits at Step 6)
- [ ] `attachments_path`
- [ ] `images_path`
- [ ] `PendingAttachment`
- [ ] `pending_attachments`
- [ ] `__space__` / `SPACE_ATTACHMENTS_DIR`
- [ ] `images/` references in any path-building code

### Frontend components
- [ ] `apps/frontend/src/components/FieldInput/ImageFieldInput.tsx`
- [ ] `apps/frontend/src/components/FieldView/RetryableImage.tsx`
- [ ] IMAGE branches in `components/FieldInput/index.tsx` and `components/FieldView/index.tsx`

### Frontend routes
- [ ] `apps/frontend/src/routes/admin/pending-attachments/` (admin review page)
- [ ] `apps/frontend/src/routes/s/_slug_/attachments/` (space-level attachment list/upload)
- [ ] `apps/frontend/src/routes/s/_slug_/_noteNumber_/attachments/` (note-level attachment list/upload)

### Generated artifacts to refresh
- [ ] `apps/frontend/src/api/openapi.gen.ts` — regenerate after backend wipe
- [ ] TanStack Router route tree — regenerate after route deletion

### CLI commands
- [ ] Any old attachment/image-related CLI commands (audit during Step 2 sweep)

## Implementation notes

Accumulates gotchas and decisions discovered during implementation. Add entries as work progresses; promote anything broadly relevant into `docs/backend.md` after merge.

_(empty — populated during Steps 3–6)_

## Migration scripts

Placeholder. Per-space migration from the old `attachments` / `images` / `pending_attachments` layout to the new `Blob` + `Attachment` + `BlobFieldValue` shape. Hand-written per space, executed against a copy of production after this branch merges. PROTOTYPE mode — no automatic migration is part of this branch.

_(populated post-merge)_

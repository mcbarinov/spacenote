# Backup

Database backup via admin panel. Uses `mongodump` under the hood.

## How it works

- Admin clicks "Create Backup" in `/admin/backups`
- Backend runs `mongodump --uri=<db_url> --archive=<path> --gzip`
- Backup saved as `spacenote-backup-{YYYYMMDD-HHmmss}.archive.gz`
- Admin can download or delete backups from the UI

## Restore

Manual only. No restore via UI.

```bash
mongorestore --gzip --archive=<file> --uri=<db_url>
```

## API

All endpoints admin-only, prefix `/api/v1`:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/backups` | Create backup |
| `GET` | `/backups` | List backups |
| `GET` | `/backups/{filename}/download` | Download backup |
| `DELETE` | `/backups/{filename}` | Delete backup |

## Config

| Variable | Description |
|----------|-------------|
| `SPACENOTE_BACKUPS_PATH` | Backup storage directory (required) |

## Requirements

- `mongodump` must be available in PATH
- Local dev: `brew install mongodb-database-tools`
- Docker: installed in backend image via `.deb` from MongoDB

## Architecture

- **Service**: `core/modules/backup/service.py` — `BackupService`
- **Model**: `core/modules/backup/models.py` — `BackupInfo` with `from_path()` factory
- **Router**: `web/routers/backups.py`
- **Frontend**: `routes/admin/backups.page.tsx`

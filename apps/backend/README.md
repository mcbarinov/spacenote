# Spacenote Backend

FastAPI backend service for the Spacenote note-taking system.

## Tech Stack

- **Python 3.14+**
- **FastAPI** - Web framework with automatic OpenAPI documentation
- **MongoDB** - Database (via pymongo async driver)
- **uv** - Package manager

## Environment Variables

All configuration uses the `SPACENOTE_` prefix. See `.env.example` for reference.

**Required:**
- `SPACENOTE_DATABASE_URL` - MongoDB connection string (e.g., `mongodb://localhost:27017/spacenote`)

**Optional:**
- `SPACENOTE_HOST` - Server host (default: `0.0.0.0`)
- `SPACENOTE_PORT` - Server port (default: `3100`)
- `SPACENOTE_DEBUG` - Debug mode (default: `false`)

## Project Structure

```
src/spacenote/
├── core/                      # Business logic layer
│   ├── modules/              # Domain modules
│   │   ├── access/          # Access control & permissions
│   │   ├── comment/         # Note comments
│   │   ├── counter/         # Sequential counters
│   │   ├── field/           # Space field definitions
│   │   ├── note/            # Notes
│   │   ├── session/         # Authentication sessions
│   │   ├── space/           # Spaces
│   │   └── user/            # User management
│   ├── db.py                # MongoDB base models
│   ├── core.py              # Services container
│   ├── pagination.py        # Pagination utilities
│   └── service.py           # Base service class
├── web/                      # FastAPI application layer
│   ├── routers/             # API endpoints
│   │   ├── auth.py          # Login/logout
│   │   ├── comments.py      # Note comments
│   │   ├── fields.py        # Space fields
│   │   ├── notes.py         # Notes
│   │   ├── profile.py       # User profile
│   │   ├── spaces.py        # Spaces
│   │   └── users.py         # User management
│   ├── deps.py              # Dependency injection
│   ├── error_handlers.py    # Error handling
│   ├── openapi.py           # OpenAPI schemas
│   ├── runner.py            # Server runner
│   └── server.py            # FastAPI app setup
├── app.py                    # Application facade
├── config.py                 # Configuration (env vars)
├── main.py                   # Entry point
├── errors.py                 # Custom exceptions
├── logging.py                # Structured logging
└── utils.py                  # Utilities
tests/                        # Test suite
```

## Development

**Setup:**
```bash
# Copy environment template
cp .env.example .env

# Install dependencies (from monorepo root)
cd ../..
uv sync --group dev

# Run backend
cd apps/backend
uv run python -m spacenote.main
```

**Linting:**
```bash
# From monorepo root
just backend-lint
```

## Architecture

For architecture decisions and database schema details, see [docs/backend.md](../../docs/backend.md).

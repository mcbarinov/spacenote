# /start-backend

Start a new backend development session by reading the project documentation.

## Description

This command initializes a new backend development session by reading the essential project files:

- `README.md` - Monorepo overview and project structure
- `docs/concepts.md` - Core domain concepts (Space, Note, Fields, Users, Comments, AI)
- `CLAUDE.md` - Development guidelines and project rules
- `ai/rules/project.md` - Project rules (git, linting, agent ports)
- `justfile` - Available development commands
- `apps/backend/README.md` - Backend setup, structure, environment variables
- `docs/backend.md` - Backend architecture (App Facade, Service Registry, DB schema)
- `ai/rules/backend.md` - AI-specific coding rules for backend

## Usage

```
/start-backend
```

## Actions

1. Read `README.md` to understand the monorepo structure
2. Read `docs/concepts.md` to understand the core domain model
3. Read `CLAUDE.md` to understand development guidelines
4. Read `ai/rules/project.md` for project rules
5. Read `justfile` to see available commands
6. Read `apps/backend/README.md` for backend setup and structure
7. Read `docs/backend.md` for backend architecture details
8. Read `ai/rules/backend.md` for AI-specific coding rules
9. Confirm readiness to begin work

## Response

After reading all files, confirm with:
"I've read the backend documentation. Ready to start working!"

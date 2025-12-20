# /start-frontend

Start a new frontend development session by reading the project documentation.

## Description

This command initializes a new frontend development session by reading the essential project files:

- `README.md` - Monorepo overview and project structure
- `docs/concepts.md` - Core domain concepts (Space, Note, Fields, Users, Comments, AI)
- `CLAUDE.md` - Development guidelines and project rules
- `ai/rules/project.md` - Project rules (git, linting, agent ports)
- `justfile` - Available development commands
- `docs/frontend.md` - Frontend architecture and patterns (React, TanStack, Mantine)
- `ai/rules/frontend.md` - AI-specific coding rules for frontend
- `docs/behavior.md` - Non-obvious behavioral scenarios
- `apps/admin/README.md` - Admin app structure and commands
- `packages/common/README.md` - Shared package (@spacenote/common)

## Usage

```
/start-frontend
```

## Actions

1. Read `README.md` to understand the monorepo structure
2. Read `docs/concepts.md` to understand the core domain model
3. Read `CLAUDE.md` to understand development guidelines
4. Read `ai/rules/project.md` for project rules
5. Read `justfile` to see available commands
6. Read `docs/frontend.md` for frontend architecture and patterns
7. Read `ai/rules/frontend.md` for AI-specific coding rules
8. Read `docs/behavior.md` for non-obvious behavioral scenarios
9. Read `apps/admin/README.md` for admin app structure
10. Read `packages/common/README.md` for shared package usage
11. Confirm readiness to begin work

## Response

After reading all files, confirm with:
"I've read the frontend documentation. Ready to start working!"

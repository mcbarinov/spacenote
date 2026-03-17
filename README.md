# Spacenote Monorepo

Spacenote is a flexible note-taking system with customizable spaces, AI-assisted workflows, and Telegram integrations. This repository hosts all core projects: the Python backend, React frontend, and deployment assets.

## Monorepo Structure

```
spacenote/
├── apps/                    # Applications
│   ├── backend/            # Python FastAPI backend
│   └── frontend/           # React frontend (user + admin)
├── ai/                      # AI agent resources
│   ├── commands/           # Claude Code slash commands
│   └── rules/              # AI coding guidelines
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── package.json            # Root package.json
└── README.md
```

## Applications

### backend
- **Technology**: Python 3.14, FastAPI, MongoDB
- **Purpose**: REST API backend with OpenAPI documentation
- **Key features**: User authentication, spaces, notes, comments, attachments, LLM integration, Telegram bot

### frontend
- **Technology**: React 19, TypeScript, Vite, TanStack Query
- **Purpose**: Unified frontend for users and admins
- **Key features**: Note management, markdown editor, filtering, exports, user management, space administration, Telegram integration
- **Admin routes**: Under `/admin/*`, guarded by username check

## Documentation

| File | Description |
|------|-------------|
| `docs/concepts.md` | Domain model, features, key decisions (read first) |
| `docs/fields.md` | Field types, options, special values, VALUE_MAPS |
| `docs/backend.md` | Backend architecture (DB schema, services) |
| `docs/frontend.md` | Frontend architecture (routing, data layer) |
| `docs/space-examples.md` | Space configuration examples |
| `docs/behavior.md` | Non-obvious behavioral scenarios (B001, B002, ...) |
| `docs/workflow.md` | Development workflow (issues, branches) |

## AI Agents

Resources for AI coding assistants (Claude Code, etc.):

- `ai/commands/` — Slash commands for starting sessions and code reviews
- `ai/rules/` — Coding guidelines for backend and frontend

To use commands with Claude Code, create a symlink:
```bash
ln -s ../ai/commands .claude/commands
```

## Technology Stack

**Backend:**
- Python 3.14 + FastAPI + MongoDB
- uv (package manager)
- Pydantic (validation)
- pytest (testing)

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- TanStack Query (server state)
- TanStack Router (routing)
- Mantine (UI components and styling)
- pnpm (package manager)

**Monorepo:**
- pnpm workspaces (package management)
- just (task automation)

## Getting Started

> Work in progress - detailed setup instructions coming soon

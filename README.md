# Spacenote Monorepo

Spacenote is a flexible note-taking system with customizable spaces, AI-assisted workflows, and Telegram integrations. This repository hosts all core projects: the Python backend, user-facing web app, admin app, shared packages, and deployment assets.

## Monorepo Structure

```
spacenote/
├── apps/                    # Applications
│   ├── backend/            # Python FastAPI backend
│   ├── web/                # React frontend for users
│   └── admin/              # React frontend for admins
├── packages/               # Shared packages
│   └── frontend-common/    # @spacenote/common - shared frontend code
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── package.json            # Root package.json
└── README.md
```

## Applications

### backend
- **Technology**: Python 3.13, FastAPI, MongoDB
- **Purpose**: REST API backend with OpenAPI documentation
- **Key features**: User authentication, spaces, notes, comments, attachments, LLM integration, Telegram bot

### web
- **Technology**: React 19, TypeScript, Vite, TanStack Query
- **Purpose**: User-facing web application
- **Key features**: Note management, markdown editor, filtering, exports

### admin
- **Technology**: React 19, TypeScript, Vite, TanStack Query
- **Purpose**: Admin panel for system management
- **Key features**: User management, space administration, LLM logs

## Packages

### @spacenote/common
Shared frontend code for all React applications:
- **Types**: Auto-generated from backend OpenAPI specification + custom types
- **API layer**: Queries, mutations, cache hooks (planned)
- **Components**: Reusable UI components, error boundaries (planned)
- **Utilities**: Formatters, helpers, error handling (planned)

## Technology Stack

**Backend:**
- Python 3.13 + FastAPI + MongoDB
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
- TypeScript project references (incremental builds)

## Getting Started

> Work in progress - detailed setup instructions coming soon

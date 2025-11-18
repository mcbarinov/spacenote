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
│   ├── types/              # TypeScript types from OpenAPI
│   ├── shared/             # Shared utilities, API client, hooks
│   └── ui/                 # Shared UI components (shadcn/ui)
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

### @spacenote/types
TypeScript types generated from backend OpenAPI specification. Used by all frontend applications for type-safe API communication.

### @spacenote/shared
Shared utilities, API client configuration, TanStack Query hooks, error handling, formatters, and common business logic.

### @spacenote/ui
Shared UI component library based on shadcn/ui with Radix UI primitives and Tailwind CSS styling.

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
- Tailwind CSS + shadcn/ui (styling)
- pnpm (package manager)

**Monorepo:**
- pnpm workspaces (package management)
- just (task automation)
- TypeScript project references (incremental builds)

## Getting Started

> Work in progress - detailed setup instructions coming soon

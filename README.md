## Spacenote Monorepo

Spacenote is a flexible note‑taking system with customizable spaces, AI‑assisted workflows, and Telegram integrations. This repository hosts all core projects: the Python backend, user‑facing web app, admin app, shared packages, and deployment assets.

### Repository structure

```text
spacenote/
  apps/
    backend/                 # Python/FastAPI service (MongoDB, OpenAPI)
    web/                     # User‑facing React app (Vite)
    admin/                   # Admin React app (Vite)
  packages/
    api-types/               # Generated TypeScript types from backend OpenAPI
    ui/                      # Shared UI kit (React + Tailwind)
    utils/                   # Shared TypeScript utilities
    configs/
      eslint/                # Shared ESLint config
      tsconfig/              # Shared base tsconfig
      tailwind/              # Shared Tailwind preset/theme
  infra/
    compose/                 # Docker Compose, Caddy config, env templates
  docs/                      # Architecture, concepts, and guides
  scripts/                   # Codegen, checks, helper CLIs
  justfile                   # Dev, test, build, compose helpers
  pnpm-workspace.yaml        # PNPM workspaces (apps and packages)
  README.md
```

### Tech overview

- Backend: Python 3.13+, FastAPI, strict mypy, ruff; MongoDB; OpenAPI exposure for type generation.
- Frontend: React 19 + Vite + TypeScript; Tailwind; two separate apps: `web` and `admin`.
- Shared packages: reusable UI, utilities, and configuration presets.
- Infra: Caddy reverse proxy and Docker Compose for local and production orchestration.

### Development (high level)

- Package managers: `uv` for Python projects; `pnpm` workspaces for Node projects.
- Typical workflow:
  - Install Node dependencies at the root with PNPM workspaces.
  - Install backend dependencies with `uv` inside `apps/backend`.
  - Run per‑app dev servers via root helper commands (see `justfile`).
- OpenAPI → TypeScript:
  - Types are generated from the backend `openapi.json` into `packages/api-types`.
  - Codegen scripts live under `scripts/` and/or the package `scripts` sections.

### Deployment

- Docker images are built per app (`backend`, `web`, `admin`).
- Caddy routes traffic either by subdomains (recommended: `app.DOMAIN`, `admin.DOMAIN`) or by paths (`/admin`, `/`).
- Compose files and templates are under `infra/compose`.

### Conventions

- TypeScript: strict mode, shared ESLint/tsconfig/Tailwind presets from `packages/configs`.
- Python: strict typing (mypy), enforced style (ruff), Python ≥ 3.13.
- Keep domain logic close to each app; extract reusable parts into `packages/`.



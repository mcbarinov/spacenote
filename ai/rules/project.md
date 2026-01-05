# Project Rules

General rules for AI agents working on this project.

## Git Conventions

Labels: `chore:`, `feat:`, `fix:`, `infra:`, `refactor:`

- Branches: `<label>/<name>` (e.g., `feat/user-management`)
- Commits: `<label>: <description>` (e.g., `feat: add user auth`)
- GitHub CLI: `gh pr create --label <label>` (without colon)

## Agent Development

Development servers have separate ports for human and agent use:

| App   | Human Port | Agent Port | Human Command    | Agent Command        |
|-------|------------|------------|------------------|----------------------|
| web   | 3000       | 3001       | just web-dev     | just agent-web-dev   |
| admin | 3200       | 3201       | just admin-dev   | just agent-admin-dev |
| api   | 3100       | 3101       | just backend-dev | just agent-backend-dev |

Rules:
- Never start/stop/restart servers on human ports (3000, 3100, 3200)
- Always use `agent-*` commands when running dev servers
- Human servers are managed by the user

## Linting

Run after making changes:

| Area | Command |
|------|---------|
| Backend | `just backend-lint` |
| Frontend (web) | `just web-lint` |
| Frontend (admin) | `just admin-lint` |
| Common package | `just common-lint` |
| All | `just lint` |

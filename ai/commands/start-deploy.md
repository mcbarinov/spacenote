# /start-deploy

Start a new deployment session by reading the project documentation.

## Description

This command initializes a new deployment session by reading the essential project files:

- `README.md` - Monorepo overview and project structure
- `CLAUDE.md` - Development guidelines and project rules
- `ai/rules/project.md` - Project rules (git, linting, agent ports)
- `ai/rules/github-issues.md` - GitHub issues workflow
- `justfile` - Available commands (docker-build, docker-push, docker-local)
- `docs/deploy.md` - Deployment guide (workflow, server setup, troubleshooting)
- `deploy/docker-compose.yml` - Production configuration (Caddy, MongoDB, services)
- `deploy/docker-compose.local.yml` - Local development stack
- `deploy/.env.example` - Environment variables reference
- `apps/backend/Dockerfile` - Backend Docker image
- `apps/web/Dockerfile` - Web Docker image
- `apps/admin/Dockerfile` - Admin Docker image

## Usage

```
/start-deploy
```

## Actions

1. Read `README.md` to understand the monorepo structure
2. Read `CLAUDE.md` to understand development guidelines
3. Read `ai/rules/project.md` for project rules
4. Read `ai/rules/github-issues.md` for GitHub issues workflow
5. Read `justfile` to see available deploy commands
6. Read `docs/deploy.md` for deployment workflow and server setup
7. Read `deploy/docker-compose.yml` for production configuration
8. Read `deploy/docker-compose.local.yml` for local stack configuration
9. Read `deploy/.env.example` for environment variables
10. Read `apps/backend/Dockerfile` for backend image setup
11. Read `apps/web/Dockerfile` for web image setup
12. Read `apps/admin/Dockerfile` for admin image setup
13. Confirm readiness to begin work

## Response

After reading all files, confirm with:
"I've read the deployment documentation. Ready to start working!"

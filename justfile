set shell := ["bash", "-cu"]
set dotenv-load

GHCR_USER := "mcbarinov"

# Lint all projects
lint:
    @echo "=== frontend ==="
    @just frontend-lint
    @echo "=== backend ==="
    @just backend-lint

outdated: backend-outdated frontend-outdated

upgrade: frontend-update

[group("backend")]
backend-clean:
    cd apps/backend && rm -rf .pytest_cache .ruff_cache .mypy_cache build dist src/*.egg-info

[group("backend")]
backend-sync:
    cd apps/backend && uv sync

[group("backend")]
backend-outdated:
    cd apps/backend && uv pip list --outdated

[group("backend")]
backend-format:
    @cd apps/backend && uv run ruff check --quiet --select I --fix src && uv run ruff format --quiet src

# Lint & typecheck
[group("backend")]
backend-lint *args: backend-format
    cd apps/backend && uv run ruff check --quiet {{args}} src tests
    cd apps/backend && uv run mypy src

# Run development server
[group("backend")]
backend-dev:
    SPACENOTE_DOTENV_PATH={{justfile_directory()}}/.env \
    uv run --directory apps/backend python -m watchfiles "python -m spacenote.main" src

[group("backend")]
backend-test:
    cd apps/backend && uv run pytest tests


[group("frontend")]
frontend-dev:
    cd apps/frontend && \
    VITE_GIT_COMMIT_HASH=$(git rev-parse HEAD) \
    VITE_PORT=${VITE_FRONTEND_PORT} \
    VITE_API_URL=${VITE_API_URL} \
    pnpm run dev

[group("frontend")]
frontend-lint:
    cd apps/frontend && pnpm run format
    cd apps/frontend && pnpm run lint
    cd apps/frontend && pnpm run typecheck

[group("frontend")]
frontend-outdated:
    cd apps/frontend && pnpm outdated || true

[group("frontend")]
frontend-update:
    cd apps/frontend && pnpm update

[group("frontend")]
frontend-routes:
    cd apps/frontend && pnpm run routes

[group("agent")]
agent-frontend-dev:
    cd apps/frontend && \
    VITE_GIT_COMMIT_HASH=$(git rev-parse HEAD) \
    VITE_PORT=${VITE_FRONTEND_PORT_AGENT} \
    VITE_API_URL=${VITE_API_URL_AGENT} \
    pnpm run dev

[group("agent")]
agent-backend-dev:
    SPACENOTE_DOTENV_PATH={{justfile_directory()}}/.env \
    SPACENOTE_PORT=${SPACENOTE_PORT_AGENT} \
    uv run --directory apps/backend python -m watchfiles "python -m spacenote.main" src


# === Docker Commands ===

# Build all images locally (native arch)
[group("docker")]
docker-build:
    just docker-build-backend & just docker-build-frontend & wait

# Build backend image locally
[group("docker")]
docker-build-backend:
    docker buildx build \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse HEAD) \
        -f apps/backend/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-backend:latest \
        --load apps/backend

# Build frontend image locally
[group("docker")]
docker-build-frontend:
    docker buildx build \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse HEAD) \
        -t ghcr.io/{{GHCR_USER}}/spacenote-frontend:latest \
        --load apps/frontend

# Build and push all images to GHCR (linux/amd64)
[group("docker")]
docker-push:
    just docker-push-backend & just docker-push-frontend & wait

# Build and push backend image to GHCR
[group("docker")]
docker-push-backend:
    docker buildx build --platform linux/amd64 \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse HEAD) \
        -f apps/backend/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-backend:latest \
        --push apps/backend

# Build and push frontend image to GHCR
[group("docker")]
docker-push-frontend:
    docker buildx build --platform linux/amd64 \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse HEAD) \
        -t ghcr.io/{{GHCR_USER}}/spacenote-frontend:latest \
        --push apps/frontend

# Start local Docker Compose stack
[group("docker")]
docker-local:
    cd deploy && docker compose -f docker-compose.local.yml up --build

# Stop local Docker Compose stack
[group("docker")]
docker-local-down:
    cd deploy && docker compose -f docker-compose.local.yml down

# Clean Docker build cache
[group("docker")]
docker-prune:
    docker builder prune -f

# Restart Colima with proper resources and setup buildx
[group("docker")]
colima-restart:
    #!/usr/bin/env bash
    set -euo pipefail

    echo "Stopping Colima..."
    colima stop 2>/dev/null || true

    echo "Starting Colima with 8 CPUs, 16GB RAM..."
    colima start --cpu 8 --memory 16 --disk 100

    echo "Setting up Docker buildx..."
    docker buildx rm builder 2>/dev/null || true
    docker buildx create --name builder --driver docker-container --use
    docker buildx inspect --bootstrap

    echo ""
    echo "Colima ready! Run 'just docker-push' to build and push images."

set shell := ["bash", "-cu"]
set dotenv-load

GHCR_USER := "mcbarinov"

# Lint all projects
lint: common-lint admin-lint web-lint backend-lint

outdated: backend-outdated common-outdated admin-outdated web-outdated

upgrade: common-update admin-update web-update

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
    cd apps/backend && uv run ruff check --select I --fix src && uv run ruff format src

# Lint & typecheck
[group("backend")]
backend-lint *args: backend-format
    cd apps/backend && uv run ruff check {{args}} src tests
    cd apps/backend && uv run mypy src

# Run development server
[group("backend")]
backend-dev:
    SPACENOTE_DOTENV_PATH={{justfile_directory()}}/.env \
    uv run --directory apps/backend python -m watchfiles "python -m spacenote.main" src

[group("backend")]
backend-test:
    cd apps/backend && uv run pytest tests


[group("common")]
common-generate:
    pnpm --filter @spacenote/common generate

[group("common")]
common-lint:
    pnpm --filter @spacenote/common run format
    pnpm --filter @spacenote/common run lint
    pnpm --filter @spacenote/common run typecheck


[group("common")]
common-outdated:
    pnpm --filter @spacenote/common outdated || true


[group("common")]
common-update:
    pnpm --filter @spacenote/common update


[group("admin")]
admin-dev:
    VITE_PORT=${VITE_ADMIN_PORT} \
    VITE_API_URL=${VITE_API_URL} \
    VITE_BASE_PATH=${VITE_BASE_PATH} \
    pnpm --filter @spacenote/admin run dev


[group("admin")]
admin-lint:
    pnpm --filter @spacenote/admin run format
    pnpm --filter @spacenote/admin run lint
    pnpm --filter @spacenote/admin run typecheck


[group("admin")]
admin-outdated:
    pnpm --filter @spacenote/admin outdated || true

[group("admin")]
admin-update:
    pnpm --filter @spacenote/admin update


[group("web")]
web-dev:
    VITE_PORT=${VITE_WEB_PORT} \
    VITE_API_URL=${VITE_API_URL} \
    pnpm --filter @spacenote/web run dev


[group("web")]
web-lint:
    pnpm --filter @spacenote/web run format
    pnpm --filter @spacenote/web run lint
    pnpm --filter @spacenote/web run typecheck


[group("web")]
web-outdated:
    pnpm --filter @spacenote/web outdated || true

[group("web")]
web-update:
    pnpm --filter @spacenote/web update

[group("web")]
web-routes:
    pnpm --filter @spacenote/web run routes


[group("agent")]
agent-web-dev:
    VITE_PORT=${VITE_WEB_PORT_AGENT} \
    VITE_API_URL=${VITE_API_URL_AGENT} \
    pnpm --filter @spacenote/web run dev

[group("agent")]
agent-admin-dev:
    VITE_PORT=${VITE_ADMIN_PORT_AGENT} \
    VITE_API_URL=${VITE_API_URL_AGENT} \
    VITE_BASE_PATH=${VITE_BASE_PATH} \
    pnpm --filter @spacenote/admin run dev

[group("agent")]
agent-backend-dev:
    SPACENOTE_DOTENV_PATH={{justfile_directory()}}/.env \
    SPACENOTE_PORT=${SPACENOTE_PORT_AGENT} \
    uv run --directory apps/backend python -m watchfiles "python -m spacenote.main" src


# === Docker Commands ===

# Build all images locally (native arch)
[group("docker")]
docker-build:
    just docker-build-backend & just docker-build-web & just docker-build-admin & wait

# Build backend image locally
[group("docker")]
docker-build-backend:
    docker buildx build \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        -f apps/backend/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-backend:latest \
        --load apps/backend

# Build web image locally
[group("docker")]
docker-build-web:
    docker buildx build \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        -f apps/web/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-web:latest \
        --load .

# Build admin image locally
[group("docker")]
docker-build-admin:
    docker buildx build \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        --build-arg VITE_BASE_PATH=/admin/ \
        -f apps/admin/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-admin:latest \
        --load .

# Build and push all images to GHCR (linux/amd64)
[group("docker")]
docker-push:
    just docker-push-backend & just docker-push-web & just docker-push-admin & wait

# Build and push backend image to GHCR
[group("docker")]
docker-push-backend:
    docker buildx build --platform linux/amd64 \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        -f apps/backend/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-backend:latest \
        --push apps/backend

# Build and push web image to GHCR
[group("docker")]
docker-push-web:
    docker buildx build --platform linux/amd64 \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        -f apps/web/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-web:latest \
        --push .

# Build and push admin image to GHCR
[group("docker")]
docker-push-admin:
    docker buildx build --platform linux/amd64 \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        --build-arg VITE_BASE_PATH=/admin/ \
        -f apps/admin/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-admin:latest \
        --push .

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


# === Worktree Commands ===

# Create a new worktree slot with pre-configured ports
[group("worktree")]
worktree-setup slot:
    #!/usr/bin/env bash
    set -euo pipefail

    SLOT={{slot}}
    WORKTREE_PATH="${WORKTREES_PATH:-$HOME/worktrees}/spacenote-w${SLOT}"

    # Calculate ports (base + slot×10)
    WEB_PORT=$((3000 + SLOT * 10))
    WEB_PORT_AGENT=$((WEB_PORT + 1))
    BACKEND_PORT=$((3100 + SLOT * 10))
    BACKEND_PORT_AGENT=$((BACKEND_PORT + 1))
    ADMIN_PORT=$((3200 + SLOT * 10))
    ADMIN_PORT_AGENT=$((ADMIN_PORT + 1))
    DATABASE="spacenote_w${SLOT}"

    echo "Creating worktree slot ${SLOT} at ${WORKTREE_PATH}"
    echo "Ports: web=${WEB_PORT}, backend=${BACKEND_PORT}, admin=${ADMIN_PORT}"
    echo "Database: ${DATABASE}"
    echo ""

    # Create worktree
    git worktree add "${WORKTREE_PATH}" main

    # Generate .env
    {
        echo "# === Backend ==="
        echo "SPACENOTE_DATABASE_URL=mongodb://localhost:27017/${DATABASE}"
        echo "SPACENOTE_SITE_URL=http://localhost:${WEB_PORT}"
        echo "SPACENOTE_HOST=0.0.0.0"
        echo "SPACENOTE_PORT=${BACKEND_PORT}"
        echo "SPACENOTE_PORT_AGENT=${BACKEND_PORT_AGENT}"
        echo "SPACENOTE_DEBUG=true"
        echo "SPACENOTE_CORS_ORIGINS='[\"http://localhost:*\"]'"
        echo "SPACENOTE_ATTACHMENTS_PATH=${WORKTREE_PATH}/tmp/data/attachments"
        echo "SPACENOTE_IMAGES_PATH=${WORKTREE_PATH}/tmp/data/images"
        echo ""
        echo "# === Frontend ==="
        echo "VITE_WEB_PORT=${WEB_PORT}"
        echo "VITE_WEB_PORT_AGENT=${WEB_PORT_AGENT}"
        echo "VITE_ADMIN_PORT=${ADMIN_PORT}"
        echo "VITE_ADMIN_PORT_AGENT=${ADMIN_PORT_AGENT}"
        echo "VITE_API_URL=http://localhost:${BACKEND_PORT}"
        echo "VITE_API_URL_AGENT=http://localhost:${BACKEND_PORT_AGENT}"
        echo "VITE_BASE_PATH=/"
    } > "${WORKTREE_PATH}/.env"

    echo "Installing dependencies..."
    cd "${WORKTREE_PATH}" && pnpm install
    cd "${WORKTREE_PATH}/apps/backend" && uv sync

    echo ""
    echo "Worktree slot ${SLOT} ready at ${WORKTREE_PATH}"

# List all worktrees
[group("worktree")]
worktree-list:
    git worktree list

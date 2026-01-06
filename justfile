set shell := ["bash", "-cu"]

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
    pnpm --filter @spacenote/web run agent-dev

[group("agent")]
agent-admin-dev:
    pnpm --filter @spacenote/admin run agent-dev

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

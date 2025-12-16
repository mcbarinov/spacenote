set dotenv-load
set shell := ["bash", "-cu"]

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
    cd apps/backend && uv run python -m watchfiles "python -m spacenote.main" src

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
    cd apps/backend && SPACENOTE_PORT=3101 uv run python -m watchfiles "python -m spacenote.main" src


# === Deploy Commands ===

GHCR_USER := "mcbarinov"

# Local builds (native arch, --load)
[group("deploy")]
deploy-build:
    just deploy-build-backend & just deploy-build-web & just deploy-build-admin & wait

[group("deploy")]
deploy-build-backend:
    docker buildx build \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        -f apps/backend/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-backend:latest \
        --load apps/backend

[group("deploy")]
deploy-build-web:
    docker buildx build \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        -f apps/web/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-web:latest \
        --load .

[group("deploy")]
deploy-build-admin:
    docker buildx build \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        --build-arg VITE_BASE_PATH=/admin/ \
        -f apps/admin/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-admin:latest \
        --load .

# Production push (linux/amd64, --push to GHCR)
[group("deploy")]
deploy-push:
    just deploy-push-backend & just deploy-push-web & just deploy-push-admin & wait

[group("deploy")]
deploy-push-backend:
    docker buildx build --platform linux/amd64 \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        -f apps/backend/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-backend:latest \
        --push apps/backend

[group("deploy")]
deploy-push-web:
    docker buildx build --platform linux/amd64 \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        -f apps/web/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-web:latest \
        --push .

[group("deploy")]
deploy-push-admin:
    docker buildx build --platform linux/amd64 \
        --build-arg GIT_COMMIT_HASH=$(git rev-parse --short HEAD) \
        --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cI) \
        --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        --build-arg VITE_BASE_PATH=/admin/ \
        -f apps/admin/Dockerfile \
        -t ghcr.io/{{GHCR_USER}}/spacenote-admin:latest \
        --push .

[group("deploy")]
deploy-local:
    cd deploy && docker compose -f docker-compose.local.yml up --build

[group("deploy")]
deploy-local-down:
    cd deploy && docker compose -f docker-compose.local.yml down

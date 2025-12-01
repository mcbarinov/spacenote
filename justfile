set dotenv-load
set shell := ["bash", "-cu"]

# Lint all projects
lint: common-lint admin-lint web-lint backend-lint

outdated: backend-outdated admin-outdated web-outdated common-outdated

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

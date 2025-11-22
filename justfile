set dotenv-load
set shell := ["bash", "-cu"]

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


[group("frontend-common")]
frontend-common-generate:
    pnpm --filter @spacenote/common generate

[group("frontend-common")]
frontend-common-lint:
    pnpm --filter @spacenote/common run format
    pnpm --filter @spacenote/common run lint
    pnpm --filter @spacenote/common run typecheck


[group("frontend-common")]
frontend-common-outdated:
    pnpm --filter @spacenote/common outdated


[group("frontend-common")]
frontend-common-update:
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
    pnpm --filter @spacenote/admin outdated

[group("admin")]
admin-update:
    pnpm --filter @spacenote/admin update

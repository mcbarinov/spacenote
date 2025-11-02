set shell := ["bash", "-cu"]

# Development
dev:all:
    @echo "stub: start all dev services"

dev:backend:
    @echo "stub: start backend dev server"

dev:web:
    @echo "stub: start web dev server"

dev:admin:
    @echo "stub: start admin dev server"

# Lint & typecheck
lint:backend:
    @echo "stub: ruff + other linters"

lint:web:
    @echo "stub: eslint"

lint:admin:
    @echo "stub: eslint"

typecheck:web:
    @echo "stub: tsc --noEmit"

typecheck:admin:
    @echo "stub: tsc --noEmit"

test:backend:
    @echo "stub: pytest"

# Compose
compose:up:
    @echo "stub: docker compose up -d"

compose:down:
    @echo "stub: docker compose down"



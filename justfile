set dotenv-load
set shell := ["bash", "-cu"] # Always use bash so &&, ||, and redirects work predictably

# --- Directories --------------------------------------------------------------
BACKEND_DIR := "backend"
FRONTEND_DIR := "frontend"


# ==============================================================================
# Backend tasks
# ==============================================================================
b-clean:
	cd {{BACKEND_DIR}} && rm -rf .pytest_cache .ruff_cache .mypy_cache build dist src/*.egg-info

b-sync:
    cd {{BACKEND_DIR}} && uv sync --all-extras

b-build: b-clean b-lint b-audit b-test
    cd {{BACKEND_DIR}} && uv build

b-format:
    cd {{BACKEND_DIR}} && uv run ruff check --select I --fix src scripts
    cd {{BACKEND_DIR}} && uv run ruff format src scripts

b-lint *args: b-format
    cd {{BACKEND_DIR}} && uv run ruff check {{args}} src scripts
    cd {{BACKEND_DIR}} && uv run mypy src

b-outdated:
    cd {{BACKEND_DIR}} && uv pip list --outdated

b-audit:
    cd {{BACKEND_DIR}} && uv export --no-dev --all-extras --format requirements-txt --no-emit-project > requirements.txt
    cd {{BACKEND_DIR}} && uv run pip-audit -r requirements.txt --disable-pip
    cd {{BACKEND_DIR}} && rm requirements.txt
    cd {{BACKEND_DIR}} && uv run bandit --silent --recursive --configfile "pyproject.toml" src scripts

b-test:
    cd {{BACKEND_DIR}} && uv run pytest tests

b-dev: # For human devs
    cd {{BACKEND_DIR}} && uv run python -m watchfiles "python -m spacenote.main" src

b-agent-start: b-agent-stop # For AI agents
    cd {{BACKEND_DIR}} && sh -c 'SPACENOTE_BACKEND_PORT=3101 uv run python -m spacenote.main > ../backend.agent.log 2>&1 & echo $! > ../backend.agent.pid'

b-agent-stop: # For AI agents
    -pkill -F ./backend.agent.pid 2>/dev/null || true
    -rm -f ./backend.agent.pid ./backend.agent.log


# ==============================================================================
# Frontend tasks
# ==============================================================================


# ==============================================================================
# Deploy tasks
# ==============================================================================
# syntax=docker/dockerfile:1.6

# Build stage
FROM python:3.14-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy only dependency files first (layer caching)
COPY pyproject.toml uv.lock ./

# Install dependencies with BuildKit cache
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project --link-mode=copy

# Copy source code
COPY ./src ./src

# Install the project (deps already cached)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-editable --link-mode=copy

# Production stage
FROM python:3.14-slim

ARG GIT_COMMIT_HASH=unknown
ARG GIT_COMMIT_DATE=unknown
ARG BUILD_TIME=unknown

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 -s /bin/bash appuser

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    SPACENOTE_HOST=0.0.0.0 \
    SPACENOTE_PORT=8000 \
    SPACENOTE_DEBUG=false \
    SPACENOTE_GIT_COMMIT_HASH=${GIT_COMMIT_HASH} \
    SPACENOTE_GIT_COMMIT_DATE=${GIT_COMMIT_DATE} \
    SPACENOTE_BUILD_TIME=${BUILD_TIME}

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "spacenote.main"]

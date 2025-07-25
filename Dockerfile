# syntax=docker/dockerfile:1.9
ARG python_version=3.13.5
ARG uv_version=0.7.19

FROM ghcr.io/astral-sh/uv:${uv_version} AS uv_builder
FROM python:${python_version} AS builder

SHELL ["/bin/sh", "-exc"]
WORKDIR /project

# Setup uv
COPY --from=uv_builder /uv /usr/local/bin/
ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON=python3.13 \
    UV_PROJECT_ENVIRONMENT=/app

# Create a virtual environment
RUN --mount=type=cache,target=/root/.cache uv venv $UV_PROJECT_ENVIRONMENT

# Install dependencies
COPY backend/pyproject.toml backend/uv.lock /project/
RUN --mount=type=cache,target=/root/.cache uv sync --frozen --no-install-project --no-dev

# Build the project
COPY backend/src/ /project/src/
RUN --mount=type=cache,target=/root/.cache uv build --wheel -o /dist /project

# Install the project package
RUN --mount=type=cache,target=/root/.cache uv pip install --python=$UV_PROJECT_ENVIRONMENT --no-deps /dist/*.whl


FROM python:${python_version}-slim
ENV PATH="/app/bin:$PATH"

RUN <<EOT
groupadd -r app
useradd -r -d /app -g app -N app
EOT

COPY --from=builder --chown=app:app /app /app

USER app
WORKDIR /app
EXPOSE 3000
CMD ["python", "-m", "spacenote.main"]
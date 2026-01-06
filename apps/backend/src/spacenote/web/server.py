import re
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from spacenote.app import App
from spacenote.config import Config
from spacenote.errors import UserError
from spacenote.web.error_handlers import general_exception_handler, user_error_handler
from spacenote.web.middlewares import MaxBodySizeMiddleware
from spacenote.web.openapi import set_custom_openapi
from spacenote.web.routers.attachments import router as attachments_router
from spacenote.web.routers.auth import router as auth_router
from spacenote.web.routers.comments import router as comments_router
from spacenote.web.routers.exports import router as exports_router
from spacenote.web.routers.fields import router as fields_router
from spacenote.web.routers.filters import router as filters_router
from spacenote.web.routers.images import router as images_router
from spacenote.web.routers.notes import router as notes_router
from spacenote.web.routers.profile import router as profile_router
from spacenote.web.routers.spaces import router as spaces_router
from spacenote.web.routers.telegram import router as telegram_router
from spacenote.web.routers.templates import router as templates_router
from spacenote.web.routers.users import router as users_router


def _get_cors_config(origins: list[str]) -> dict[str, Any]:
    """Convert origin list to CORSMiddleware config, supporting wildcards like http://localhost:*"""
    regex_patterns = []
    exact_origins = []

    for origin in origins:
        if "*" in origin:
            pattern = re.escape(origin).replace(r"\*", r".*")
            regex_patterns.append(pattern)
        else:
            exact_origins.append(origin)

    if regex_patterns:
        combined = "|".join(f"({p})" for p in regex_patterns)
        if exact_origins:
            exact_escaped = "|".join(re.escape(o) for o in exact_origins)
            combined = f"{combined}|{exact_escaped}"
        return {"allow_origin_regex": f"^({combined})$"}
    return {"allow_origins": exact_origins}


def create_fastapi_app(app_instance: App, config: Config) -> FastAPI:
    """Create and configure FastAPI application."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
        """FastAPI application lifespan management."""
        app.state.app = app_instance
        async with app_instance.lifespan():
            yield

    app = FastAPI(
        title="SpaceNote API",
        lifespan=lifespan,
    )

    # Configure middlewares
    app.add_middleware(MaxBodySizeMiddleware, max_body_size=config.max_upload_size)
    cors_config = _get_cors_config(config.cors_origins)
    app.add_middleware(CORSMiddleware, **cors_config, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

    # Register error handlers
    app.add_exception_handler(UserError, user_error_handler)
    app.add_exception_handler(Exception, general_exception_handler)

    # Register routers
    app.include_router(attachments_router, prefix="/api/v1")
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(comments_router, prefix="/api/v1")
    app.include_router(exports_router, prefix="/api/v1")
    app.include_router(fields_router, prefix="/api/v1")
    app.include_router(filters_router, prefix="/api/v1")
    app.include_router(images_router, prefix="/api/v1")
    app.include_router(notes_router, prefix="/api/v1")
    app.include_router(profile_router, prefix="/api/v1")
    app.include_router(spaces_router, prefix="/api/v1")
    app.include_router(telegram_router, prefix="/api/v1")
    app.include_router(templates_router, prefix="/api/v1")
    app.include_router(users_router, prefix="/api/v1")

    # Apply custom OpenAPI schema
    set_custom_openapi(app)

    @app.get("/health", response_model=None)
    async def health_check() -> dict[str, str] | JSONResponse:
        db_healthy = await app_instance.check_database_health()
        if db_healthy:
            return {"status": "healthy", "database": "connected"}
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"},
        )

    return app

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from spacenote.app import App
from spacenote.errors import UserError
from spacenote.web.error_handlers import general_exception_handler, user_error_handler
from spacenote.web.openapi import set_custom_openapi
from spacenote.web.routers import auth_router, profile_router, users_router


def create_fastapi_app(app_instance: App) -> FastAPI:
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

    # Register error handlers
    app.add_exception_handler(UserError, user_error_handler)
    app.add_exception_handler(Exception, general_exception_handler)

    # Register routers
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(profile_router, prefix="/api/v1")
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

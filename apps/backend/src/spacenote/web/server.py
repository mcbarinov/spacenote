from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from spacenote.app import App


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

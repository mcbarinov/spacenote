from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from spacenote.core.app import App
from spacenote.core.errors import UserError
from spacenote.web.config import WebConfig
from spacenote.web.error_handlers import general_exception_handler, user_error_handler
from spacenote.web.openapi import set_custom_openapi
from spacenote.web.routers import auth_router, spaces_router


def create_fastapi_app(app_instance: App, web_config: WebConfig) -> FastAPI:
    """Create and configure FastAPI application."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
        """FastAPI application lifespan management."""
        # Store app instance in app state
        app.state.app = app_instance
        async with app_instance.lifespan():
            yield

    app = FastAPI(
        title="SpaceNote API",
        lifespan=lifespan,
        openapi_tags=[],  # Tags will be added by custom OpenAPI function
    )

    

    app.add_middleware(SessionMiddleware, secret_key=web_config.session_secret_key)

    # Add CORS middleware for frontend development
    if web_config.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=web_config.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Health check endpoint
    @app.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "healthy"}

    app.include_router(auth_router, prefix="/api")
    app.include_router(spaces_router, prefix="/api")

    # Register error handlers
    app.add_exception_handler(UserError, user_error_handler)
    app.add_exception_handler(Exception, general_exception_handler)


    set_custom_openapi(app)

    return app

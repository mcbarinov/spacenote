from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def set_custom_openapi(app: FastAPI) -> None:
    def custom_openapi() -> dict[str, Any]:
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title="SpaceNote API",
            version="0.0.1",
            summary="Flexible note-taking system with customizable spaces",
            routes=app.routes,
        )

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]

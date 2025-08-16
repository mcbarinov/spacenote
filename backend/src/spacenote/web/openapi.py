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

        openapi_schema["components"]["securitySchemes"] = {
            "SessionAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "X-Auth-Token",
            }
        }

        # Apply security to all paths except /auth/login
        for path, methods in openapi_schema["paths"].items():
            if "/auth/login" not in path:
                for method in methods.values():
                    if isinstance(method, dict):
                        method["security"] = [{"SessionAuth": []}]

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi

from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send


class MaxBodySizeMiddleware:
    """ASGI middleware to limit request body size based on Content-Length header."""

    def __init__(self, app: ASGIApp, max_body_size: int) -> None:
        self.app = app
        self.max_body_size = max_body_size

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        content_length = headers.get(b"content-length")

        if content_length and int(content_length) > self.max_body_size:
            response = JSONResponse(
                status_code=413,
                content={"error": f"Request body too large (max {self.max_body_size} bytes)"},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)

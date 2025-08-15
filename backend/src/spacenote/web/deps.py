from typing import Annotated, cast

from fastapi import Depends, Request

from spacenote.core.app import App
from spacenote.core.errors import AuthenticationError
from spacenote.core.session.models import AuthToken


async def get_app(request: Request) -> App:
    return cast(App, request.app.state.app)


async def get_auth_token(request: Request) -> AuthToken:
    """Get and validate auth token, raise AuthenticationError if invalid."""
    app = cast(App, request.app.state.app)

    # Check X-Auth-Token header first
    token_header = request.headers.get("x-auth-token")
    if token_header:
        auth_token = AuthToken(token_header)
        if await app.is_auth_token_valid(auth_token):
            return auth_token

    # Fallback to cookies
    token_cookie = request.cookies.get("auth_token")
    if token_cookie:
        auth_token = AuthToken(token_cookie)
        if await app.is_auth_token_valid(auth_token):
            return auth_token

    raise AuthenticationError("Valid auth token required")


# Type aliases for dependencies
AppDep = Annotated[App, Depends(get_app)]
AuthTokenDep = Annotated[AuthToken, Depends(get_auth_token)]

from typing import Annotated, cast

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from spacenote.app import App
from spacenote.core.modules.session.models import AuthToken
from spacenote.errors import AuthenticationError

# Security schemes
bearer_scheme = HTTPBearer(auto_error=False)


async def get_app(request: Request) -> App:
    return cast(App, request.app.state.app)


async def get_auth_token(
    request: Request,
    app: Annotated[App, Depends(get_app)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)] = None,
) -> AuthToken:
    """Get and validate auth token from Authorization Bearer header or cookie."""

    # Check Bearer token first (preferred)
    if credentials and credentials.scheme == "Bearer":
        auth_token = AuthToken(credentials.credentials)
        if await app.is_auth_token_valid(auth_token):
            return auth_token

    # Fallback to cookies - check with strict user type validation
    for cookie_name in ("token_admin", "token_web"):
        token = request.cookies.get(cookie_name)
        if not token:
            continue

        auth_token = AuthToken(token)
        if not await app.is_auth_token_valid(auth_token):
            continue

        # Validate cookie matches user type (admin cookie for admin, web cookie for others)
        user = await app.get_current_user(auth_token)
        is_admin_cookie = cookie_name == "token_admin"
        is_admin_user = user.username == "admin"

        if is_admin_cookie == is_admin_user:
            return auth_token

    raise AuthenticationError


# Type aliases for dependencies
AppDep = Annotated[App, Depends(get_app)]
AuthTokenDep = Annotated[AuthToken, Depends(get_auth_token)]

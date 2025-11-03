from spacenote.web.routers.auth import router as auth_router
from spacenote.web.routers.profile import router as profile_router
from spacenote.web.routers.users import router as users_router

__all__ = ["auth_router", "profile_router", "users_router"]

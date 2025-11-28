from spacenote.web.routers.attachments import router as attachments_router
from spacenote.web.routers.auth import router as auth_router
from spacenote.web.routers.comments import router as comments_router
from spacenote.web.routers.fields import router as fields_router
from spacenote.web.routers.images import router as images_router
from spacenote.web.routers.notes import router as notes_router
from spacenote.web.routers.profile import router as profile_router
from spacenote.web.routers.spaces import router as spaces_router
from spacenote.web.routers.users import router as users_router

__all__ = [
    "attachments_router",
    "auth_router",
    "comments_router",
    "fields_router",
    "images_router",
    "notes_router",
    "profile_router",
    "spaces_router",
    "users_router",
]

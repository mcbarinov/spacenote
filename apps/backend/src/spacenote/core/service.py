from __future__ import annotations

from typing import TYPE_CHECKING, Any

from pymongo.asynchronous.database import AsyncDatabase

if TYPE_CHECKING:
    from spacenote.core.core import Core


class Service:
    """Base class for services."""

    _core: Core | None

    def set_core(self, core: Core) -> None:
        """Inject core reference (called by ServiceRegistry)."""
        self._core = core

    @property
    def core(self) -> Core:
        """Get the core application context."""
        core: Core | None = getattr(self, "_core", None)
        if core is None:
            raise RuntimeError("Core not set for service")
        return core

    @property
    def database(self) -> AsyncDatabase[dict[str, Any]]:
        """Get the database from core."""
        return self.core.database

    async def on_start(self) -> None:
        """Initialize service on application startup."""

    async def on_stop(self) -> None:
        """Cleanup service on application shutdown."""

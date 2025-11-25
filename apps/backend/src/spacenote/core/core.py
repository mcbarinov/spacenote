from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any
from urllib.parse import urlparse

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.config import Config
from spacenote.core.modules.access.service import AccessService
from spacenote.core.modules.field.service import FieldService
from spacenote.core.modules.session.service import SessionService
from spacenote.core.modules.space.service import SpaceService
from spacenote.core.modules.user.service import UserService
from spacenote.core.service import Service


class ServiceRegistry:
    """Service registry that automatically discovers and initializes services."""

    user: UserService
    session: SessionService
    access: AccessService
    space: SpaceService
    field: FieldService

    def __init__(self, database: AsyncDatabase[dict[str, Any]]) -> None:
        """Initialize all services."""
        self.user = UserService(database)
        self.session = SessionService(database)
        self.access = AccessService(database)
        self.space = SpaceService(database)
        self.field = FieldService(database)

        self._services: list[Service] = [self.user, self.session, self.access, self.space, self.field]

    def set_core(self, core: Core) -> None:
        """Set core reference for all services."""
        for service in self._services:
            service.set_core(core)

    async def start_all(self) -> None:
        """Start all services that have startup logic."""
        for service in self._services:
            if hasattr(service, "on_start"):
                await service.on_start()

    async def stop_all(self) -> None:
        """Stop all services that have cleanup logic."""
        for service in self._services:
            if hasattr(service, "on_stop"):
                await service.on_stop()


class Core:
    """Container providing config, database, and all service instances."""

    config: Config
    mongo_client: AsyncMongoClient[dict[str, Any]]
    database: AsyncDatabase[dict[str, Any]]
    services: ServiceRegistry

    def __init__(self, config: Config) -> None:
        self.config = config
        self.mongo_client = AsyncMongoClient(config.database_url, uuidRepresentation="standard", tz_aware=True)
        self.database = self.mongo_client.get_database(urlparse(config.database_url).path[1:])
        self.services = ServiceRegistry(self.database)
        self.services.set_core(self)

    @asynccontextmanager
    async def lifespan(self) -> AsyncGenerator[None]:
        """Manage application lifecycle - startup and shutdown."""
        await self.on_start()
        try:
            yield
        finally:
            await self.on_stop()

    async def on_start(self) -> None:
        """Start all services on application startup."""
        await self.services.start_all()

    async def on_stop(self) -> None:
        """Stop services and close MongoDB connection on shutdown."""
        await self.services.stop_all()
        await self.mongo_client.aclose()

    async def check_database_health(self) -> bool:
        """Check if database connection is healthy."""
        try:
            await self.mongo_client.admin.command("ping")
        except Exception:
            return False
        else:
            return True

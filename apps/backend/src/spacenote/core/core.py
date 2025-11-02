from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any
from urllib.parse import urlparse

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.config import Config


class Core:
    """Container providing config, database, and MongoDB client."""

    config: Config
    mongo_client: AsyncMongoClient[dict[str, Any]]
    database: AsyncDatabase[dict[str, Any]]

    def __init__(self, config: Config) -> None:
        self.config = config
        self.mongo_client = AsyncMongoClient(config.database_url, uuidRepresentation="standard", tz_aware=True)
        self.database = self.mongo_client.get_database(urlparse(config.database_url).path[1:])

    @asynccontextmanager
    async def lifespan(self) -> AsyncGenerator[None]:
        """Manage application lifecycle - startup and shutdown."""
        await self.on_start()
        try:
            yield
        finally:
            await self.on_stop()

    async def on_start(self) -> None:
        """Initialize core on application startup."""

    async def on_stop(self) -> None:
        """Close MongoDB connection on shutdown."""
        await self.mongo_client.aclose()

    async def check_database_health(self) -> bool:
        """Check if database connection is healthy."""
        try:
            await self.mongo_client.admin.command("ping")
        except Exception:
            return False
        else:
            return True

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any
from urllib.parse import urlparse

from bson.codec_options import CodecOptions, TypeRegistry
from bson.decimal128 import DecimalDecoder, DecimalEncoder
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from spacenote.config import Config
from spacenote.core.modules.access.service import AccessService
from spacenote.core.modules.attachment.service import AttachmentService
from spacenote.core.modules.comment.service import CommentService
from spacenote.core.modules.counter.service import CounterService
from spacenote.core.modules.export.service import ExportService
from spacenote.core.modules.field.service import FieldService
from spacenote.core.modules.filter.service import FilterService
from spacenote.core.modules.image.service import ImageService
from spacenote.core.modules.note.service import NoteService
from spacenote.core.modules.session.service import SessionService
from spacenote.core.modules.space.service import SpaceService
from spacenote.core.modules.telegram.service import TelegramService
from spacenote.core.modules.template.service import TemplateService
from spacenote.core.modules.user.service import UserService
from spacenote.core.service import Service


class ServiceRegistry:
    """Service registry that automatically discovers and initializes services."""

    user: UserService
    session: SessionService
    access: AccessService
    space: SpaceService
    field: FieldService
    filter: FilterService
    counter: CounterService
    note: NoteService
    comment: CommentService
    attachment: AttachmentService
    image: ImageService
    export: ExportService
    template: TemplateService
    telegram: TelegramService

    def __init__(self, core: Core) -> None:
        """Initialize all services and inject core reference."""
        self.user = UserService()
        self.session = SessionService()
        self.access = AccessService()
        self.space = SpaceService()
        self.field = FieldService()
        self.filter = FilterService()
        self.counter = CounterService()
        self.note = NoteService()
        self.comment = CommentService()
        self.attachment = AttachmentService()
        self.image = ImageService()
        self.export = ExportService()
        self.template = TemplateService()
        self.telegram = TelegramService()

        # Auto-discover services and inject core
        self._services = [v for v in vars(self).values() if isinstance(v, Service)]
        for service in self._services:
            service.set_core(core)

    async def start_all(self) -> None:
        """Start all services."""
        for service in self._services:
            await service.on_start()

    async def stop_all(self) -> None:
        """Stop all services."""
        for service in self._services:
            await service.on_stop()


class Core:
    """Container providing config, database, and all service instances."""

    config: Config
    mongo_client: AsyncMongoClient[dict[str, Any]]
    database: AsyncDatabase[dict[str, Any]]
    services: ServiceRegistry

    def __init__(self, config: Config) -> None:
        self.config = config

        # Configure TypeRegistry with Decimal codec
        type_registry = TypeRegistry([DecimalEncoder(), DecimalDecoder()])
        codec_options: CodecOptions[dict[str, Any]] = CodecOptions(type_registry=type_registry, tz_aware=True)

        # Initialize MongoDB client
        self.mongo_client = AsyncMongoClient(config.database_url, uuidRepresentation="standard", tz_aware=True)

        # Get database with codec options
        db_name = urlparse(config.database_url).path[1:]
        self.database = self.mongo_client.get_database(db_name, codec_options=codec_options)

        self.services = ServiceRegistry(self)

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

# Backend AI Guidelines

Rules for AI agents working on the backend codebase.

## Python

- **No `__all__` exports** — We don't use `from module import *`. Always use explicit imports.

- **No single-use helpers** — Don't extract simple logic used only once into separate functions. Inline with a comment instead.

- **Document TYPE_CHECKING usage** — When using `from __future__ import annotations` with `if TYPE_CHECKING:` blocks, always add a comment explaining why it's needed (circular imports, performance, optional dependency, etc.).

## API Models

- **All API models must inherit from `OpenAPIModel`** — Models used in router signatures (request/response types) must inherit from `OpenAPIModel` or its descendants (`MongoModel`). This ensures consistent OpenAPI schema generation without `-Input`/`-Output` suffixes.

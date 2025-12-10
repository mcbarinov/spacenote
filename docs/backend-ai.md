# Backend AI Guidelines

Rules for AI agents working on the backend codebase.

## Python

- **No `assert` in production code** — Use explicit exceptions instead. `assert` statements are removed when Python runs with `-O` flag.

- **No `__all__` exports** — We don't use `from module import *`. Always use explicit imports.

- **No single-use helpers** — Don't extract simple logic used only once into separate functions. Inline with a comment instead.

- **Document TYPE_CHECKING usage** — When using `from __future__ import annotations` with `if TYPE_CHECKING:` blocks, always add a comment explaining why it's needed (circular imports, performance, optional dependency, etc.).

## Naming

- **`list_*` for collections, `get_*` for single items** — Methods returning multiple items use `list_` prefix (e.g., `list_notes()`), methods returning one item by identifier use `get_` prefix (e.g., `get_note()`).

## API Models

- **All API models must inherit from `OpenAPIModel`** — Models used in router signatures (request/response types) must inherit from `OpenAPIModel` or its descendants (`MongoModel`). This ensures consistent OpenAPI schema generation without `-Input`/`-Output` suffixes.

- **Field descriptions over inline comments** — Use `Field(description="...")` instead of `# comment` for model fields. Descriptions appear in OpenAPI schema and are accessible to frontend.

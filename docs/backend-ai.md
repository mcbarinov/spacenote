# Backend AI Guidelines

Rules for AI agents working on the backend codebase.

## Python

- **No `__all__` exports** — We don't use `from module import *`. Always use explicit imports.

- **No single-use helpers** — Don't extract simple logic used only once into separate functions. Inline with a comment instead.

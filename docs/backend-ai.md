# Backend AI Guidelines

Rules for AI agents working on the backend codebase.

## Python

- **No `__all__` exports** — We don't use `from module import *`. Always use explicit imports.

- **No single-use helpers** — Don't create functions for one-liner logic used only once. Inline with a comment.

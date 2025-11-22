# @spacenote/common

Shared frontend code for all React applications (admin, web).

## Structure

```
src/
├── api/              # API layer: queries, mutations, cache, HTTP client
├── components/       # Reusable components (ErrorBoundary, ErrorMessage)
├── errors/           # AppError class for error handling
└── types/            # TypeScript types from OpenAPI + custom types
```

## Usage

```typescript
// API layer
import { api, queryClient } from "@spacenote/common/api"

// Components
import { ErrorBoundary, ErrorMessage } from "@spacenote/common/components"

// Error handling
import { AppError } from "@spacenote/common/errors"

// Types
import type { User, LoginRequest } from "@spacenote/common/types"
```

## Scripts

```bash
# Generate types from OpenAPI
pnpm generate
```

## Architecture

See [docs/frontend.md](/docs/frontend.md) for architecture details and patterns.

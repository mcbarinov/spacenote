# @spacenote/common

Shared frontend code for all React applications (admin, web).

## Structure

```
src/
├── api/              # API layer: queries, mutations, cache, HTTP client
├── app/              # App bootstrap: createAppRouter, renderApp
├── components/       # Reusable components
│   ├── errors/       # ErrorBoundary
│   ├── layout/       # AuthLayout, Header, Footer, LoadingScreen, ErrorScreen
│   ├── navigation/   # CustomLink, LinkButton
│   └── ui/           # DeleteButton, ErrorMessage
├── errors/           # AppError class for error handling
├── types/            # TypeScript types from OpenAPI + custom types
└── utils/            # Utility functions (format, etc.)
```

## Usage

```typescript
// App bootstrap
import { createAppRouter, renderApp } from "@spacenote/common/app"

// API layer
import { api, queryClient } from "@spacenote/common/api"

// Components
import { ErrorBoundary, ErrorMessage, CustomLink, LinkButton } from "@spacenote/common/components"

// Error handling
import { AppError } from "@spacenote/common/errors"

// Types
import type { User, LoginRequest } from "@spacenote/common/types"

// Utilities
import { formatDate } from "@spacenote/common/utils"
```

## Scripts

```bash
# Generate types from OpenAPI
pnpm generate
```

## Architecture

See [docs/frontend.md](/docs/frontend.md) for architecture details and patterns.

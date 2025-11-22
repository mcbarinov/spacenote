# Admin App

Admin panel for Spacenote system management.

## Structure

```
src/
├── main.tsx         # App entry point
├── router.ts        # TanStack Router configuration
└── routes/          # File-based routing
    ├── __root.tsx   # Root layout
    ├── _auth/       # Authenticated routes
    │   ├── -components/  # Route-specific components
    │   └── route.tsx     # Auth layout
    └── login.tsx    # Login page
```

## Development

```bash
# Start dev server (port 3000)
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build
```

## Architecture

See [docs/frontend.md](/docs/frontend.md) for architecture details and patterns.

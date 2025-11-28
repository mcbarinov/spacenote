# Admin App

Admin panel for Spacenote system management.

## Structure

```
src/
├── main.tsx            # App entry point
├── routeTree.gen.ts    # Auto-generated route tree
└── routes/             # File-based routing
    ├── __root.tsx      # Root layout
    ├── login.tsx       # Login page
    └── _auth/          # Authenticated routes
        ├── route.tsx   # Auth layout
        ├── index.tsx   # Dashboard
        ├── users/      # User management
        │   └── -components/
        └── spaces/     # Space management
            ├── new.tsx
            ├── -components/
            └── $slug/fields/
                ├── new.tsx
                └── -components/
```

## Development

```bash
# Start dev server (port 3200)
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

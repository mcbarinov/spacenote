# Admin App

Admin panel for Spacenote system management.

## Structure

```
src/
├── main.tsx
├── routeTree.gen.ts
└── routes/
    ├── __root.tsx
    ├── login.tsx
    └── _auth/
        ├── index.tsx
        ├── route.tsx
        ├── spaces/
        │   ├── index.tsx
        │   ├── new.tsx
        │   ├── -components/
        │   │   └── SpacesTable.tsx
        │   └── $slug/fields/
        │       ├── index.tsx
        │       ├── new.tsx
        │       └── -components/
        │           └── FieldsTable.tsx
        └── users/
            ├── route.tsx
            └── -components/
                ├── CreateUserModal.tsx
                └── UsersTable.tsx
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

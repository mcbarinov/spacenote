# Admin App

Admin panel for Spacenote system management.

## Structure

```
src/
├── main.tsx
├── components/
│   ├── SpaceHeader.tsx
│   └── SpaceMenu.tsx
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
        │   └── $slug/
        │       ├── members/
        │       │   └── route.tsx
        │       ├── fields/
        │       │   ├── index.tsx
        │       │   ├── new.tsx
        │       │   └── -components/
        │       │       └── FieldsTable.tsx
        │       ├── filters/
        │       │   ├── index.tsx
        │       │   ├── new.tsx
        │       │   └── -components/
        │       │       └── FiltersTable.tsx
        │       └── settings/
        │           ├── index.tsx
        │           └── -components/
        │               ├── DeleteSpace.tsx
        │               ├── EditDescription.tsx
        │               ├── EditHiddenFieldsOnCreate.tsx
        │               ├── EditNotesListDefaultColumns.tsx
        │               └── EditTitle.tsx
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

# Admin App

Admin panel for Spacenote system management.

## Structure

```
src/
├── main.tsx
├── components/
│   ├── SpaceMenu.tsx
│   └── SpaceTabs.tsx
└── routes/
    ├── __root.tsx
    ├── login.tsx
    └── _auth/
        ├── index.tsx
        ├── route.tsx
        ├── spaces/
        │   ├── index.tsx
        │   ├── new.tsx
        │   ├── import.tsx
        │   ├── -components/
        │   │   └── SpacesTable.tsx
        │   └── $slug/
        │       ├── export/
        │       ├── members/
        │       ├── fields/
        │       ├── filters/
        │       ├── settings/
        │       │   └── -components/
        │       │       ├── DeleteSpace.tsx
        │       │       ├── EditDescription.tsx
        │       │       ├── EditHiddenFieldsOnCreate.tsx
        │       │       ├── EditTelegram.tsx
        │       │       └── EditTitle.tsx
        │       └── templates/
        ├── telegram/
        │   ├── tasks/
        │   └── mirrors/
        └── users/
            ├── index.tsx
            ├── new.tsx
            └── -components/
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

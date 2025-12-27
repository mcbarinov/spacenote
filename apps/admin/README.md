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
    ├── routes.ts                  # Route tree definition
    ├── root.layout.tsx
    ├── auth.layout.tsx
    ├── login.page.tsx
    ├── index/
    │   ├── page.tsx
    │   └── -components/users/
    ├── spaces/
    │   ├── index.page.tsx
    │   ├── new.page.tsx
    │   ├── import.page.tsx
    │   ├── -components/
    │   └── _slug_/
    │       ├── export.page.tsx
    │       ├── members.page.tsx
    │       ├── fields/
    │       ├── filters/
    │       ├── settings/
    │       └── templates/
    └── telegram/
        ├── tasks/
        │   ├── page.tsx
        │   └── -components/
        └── mirrors/
            ├── page.tsx
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

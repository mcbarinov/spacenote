# Web App

User-facing web application for Spacenote.

## Structure

```
src/
├── main.tsx
├── routeTree.gen.ts     # Auto-generated
├── components/          # App-specific components
│   ├── FieldInput.tsx
│   ├── FieldView.tsx
│   ├── MarkdownDisplay.tsx
│   └── MarkdownEditor.tsx
└── routes/
    ├── __root.tsx
    ├── login.tsx
    └── _auth/
        ├── -components/
        │   └── SpaceCard.tsx
        ├── index.tsx
        ├── route.tsx
        └── s/$slug/
            ├── index.tsx
            ├── new.tsx
            └── $noteNumber/
                ├── route.tsx
                └── -components/
                    ├── CommentForm.tsx
                    ├── CommentList.tsx
                    └── NoteDetails.tsx
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

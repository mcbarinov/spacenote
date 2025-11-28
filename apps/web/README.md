# Web App

User-facing web application for Spacenote.

## Structure

```
src/
├── main.tsx
├── components/
│   ├── FieldInput.tsx
│   ├── FieldView.tsx
│   ├── ImageFieldInput.tsx
│   ├── MarkdownDisplay.tsx
│   └── MarkdownEditor.tsx
└── routes/
    ├── __root.tsx
    ├── login.tsx
    ├── routeTree.gen.ts         # Auto-generated
    └── _auth/
        ├── -components/
        │   └── SpaceCard.tsx
        ├── index.tsx
        ├── route.tsx
        └── s/$slug/
            ├── -components/
            │   ├── CommentForm.tsx
            │   ├── CommentList.tsx
            │   └── NoteDetails.tsx
            ├── index.tsx
            ├── new.tsx
            ├── attachments/
            │   ├── index.tsx
            │   └── new.tsx
            └── $noteNumber/
                ├── -components/
                │   ├── CommentForm.tsx
                │   ├── CommentList.tsx
                │   └── NoteDetails.tsx
                ├── index.tsx
                └── attachments/
                    ├── index.tsx
                    └── new.tsx
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

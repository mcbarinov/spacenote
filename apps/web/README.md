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
│   ├── MarkdownEditor.tsx
│   └── SpaceHeader.tsx
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
            ├── attachments/
            │   ├── index.tsx
            │   └── new.tsx
            └── $noteNumber/
                ├── index.tsx
                ├── -components/
                │   ├── CommentForm.tsx
                │   ├── CommentList.tsx
                │   └── NoteDetails.tsx
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

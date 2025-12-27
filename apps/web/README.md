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
│   ├── NoteForm.tsx
│   └── ViewModeMenu.tsx
└── routes/
    ├── routes.ts                 # Route tree definition
    ├── root.layout.tsx
    ├── auth.layout.tsx
    ├── login.page.tsx
    ├── index/
    │   ├── page.tsx
    │   └── -components/
    │       └── SpaceCard.tsx
    └── s/_slug_/
        ├── index/
        │   ├── page.tsx
        │   └── -components/
        │       ├── ActiveQueryFilters.tsx
        │       ├── AdhocFilterDrawer.tsx
        │       ├── NotesListDefault.tsx
        │       ├── NotesListJson.tsx
        │       └── NotesListTemplate.tsx
        ├── new.page.tsx
        ├── attachments/
        │   ├── index.page.tsx
        │   └── new.page.tsx
        └── _noteNumber_/
            ├── index/
            │   ├── page.tsx
            │   └── -components/
            │       ├── CommentForm.tsx
            │       ├── CommentList.tsx
            │       ├── NoteDetailsDefault.tsx
            │       ├── NoteDetailsJson.tsx
            │       └── NoteDetailsTemplate.tsx
            ├── edit.page.tsx
            └── attachments/
                ├── index.page.tsx
                └── new.page.tsx
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

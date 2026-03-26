# Frontend

React SPA for Spacenote. Unified app serving both user and admin routes.

## Tech Stack

- **React 19** + **TypeScript 6** + **Vite 8**
- **Mantine 8** — UI components, forms, notifications, modals
- **TanStack Router** — virtual file routes, type-safe navigation
- **TanStack Query** — server state, caching, suspense
- **ky** — HTTP client
- **Zod 4** — validation (+ mantine-form-zod-resolver)
- **LiquidJS** — custom note templates
- **openapi-typescript** — type generation from backend OpenAPI spec

## Scripts

```bash
pnpm --filter frontend dev          # Dev server (port 3000)
pnpm --filter frontend build        # Type-check + production build
pnpm --filter frontend lint         # ESLint
pnpm --filter frontend typecheck    # TypeScript type-check only
pnpm --filter frontend openapi      # Regenerate types from OpenAPI (backend must be running)
pnpm --filter frontend routes       # Regenerate route tree
```

## Route Map

```
/login                              Login page
/                                   Home — space cards grid

# Content — notes, comments, attachments
/s/:slug                            Note list (with filters)
/s/:slug/new                        Create note
/s/:slug/attachments                Space attachments
/s/:slug/attachments/new            Upload space attachment
/s/:slug/:noteNumber                Note detail (default / template / JSON view)
/s/:slug/:noteNumber/edit           Edit note
/s/:slug/:noteNumber/attachments    Note attachments
/s/:slug/:noteNumber/attachments/new Upload note attachment

# Space configuration — fields, filters, templates, members
/spaces/new                         Create space
/spaces/import                      Import space
/spaces/:slug/members               Manage members
/spaces/:slug/fields                Field list
/spaces/:slug/fields/new            Create field
/spaces/:slug/fields/:fieldName/edit Edit field
/spaces/:slug/filters               Filter list
/spaces/:slug/filters/new           Create filter
/spaces/:slug/filters/:filterName/edit Edit filter
/spaces/:slug/templates             Template editor (Liquid + React Live)
/spaces/:slug/export                Export space data
/spaces/:slug/settings              Space settings

# Admin — users, integrations
/admin/users                        User list
/admin/users/new                    Create user
/admin/telegram/tasks               Telegram tasks
/admin/telegram/mirrors             Telegram mirrors
/admin/pending-attachments          Pending attachments review
```

### Layout Guards

| Layout          | Path prefix | Purpose                                                    |
| --------------- | ----------- | ---------------------------------------------------------- |
| `root.layout`   | all         | QueryClient context, 404 page                              |
| `auth.layout`   | `/_auth/*`  | Auth check, redirect to login, Header/Footer/ErrorBoundary |
| `spaces/layout` | `/spaces/*` | Space exists + user has "all" permission                   |
| `admin/layout`  | `/admin/*`  | `is_admin` flag check, preloads users list                 |

## Project Structure

```
src/
├── main.tsx                        App entry point
│
├── api/                            Data layer
│   ├── index.ts                    Unified `api` object (api.queries, api.mutations, api.cache)
│   ├── queries.ts                  TanStack Query options (queryKey + queryFn)
│   ├── mutations.ts                Mutation hooks (HTTP + cache invalidation)
│   ├── cache.ts                    Suspense cache hooks (useSpace, useCurrentUser, etc.)
│   ├── httpClient.ts               ky instance configured for /api/v1
│   └── queryClient.ts              QueryClient setup
│
├── components/                     Shared components (used across unrelated routes)
│   ├── Header.tsx                  App header with navigation
│   ├── Footer.tsx                  App footer
│   ├── ErrorBoundary.tsx           Catches render errors, handles unauthorized
│   ├── ErrorScreen.tsx             Full-page error (route errorComponent)
│   ├── ErrorMessage.tsx            Inline error alert (mutation errors)
│   ├── LoadingScreen.tsx           Full-page loader (route pendingComponent)
│   ├── PageHeader.tsx              Page title + back button pattern
│   ├── NavigationTabs.tsx          Tab navigation for space sections
│   ├── NoteForm.tsx                Note create/edit form (dynamic fields)
│   ├── FieldInput.tsx              Renders input for any field type
│   ├── FieldView.tsx               Renders read-only value for any field type
│   ├── ImageFieldInput.tsx         Image upload with preview
│   ├── RecurrenceFieldInput.tsx    Recurrence schedule input
│   ├── RecurrenceFieldView.tsx     Recurrence schedule display
│   ├── MarkdownEditor.tsx          Markdown textarea with preview
│   ├── MarkdownDisplay.tsx         Rendered markdown output
│   ├── TemplateRenderer.tsx        LiquidJS template rendering
│   ├── RetryableImage.tsx          Image with retry on load failure
│   ├── DeleteButton.tsx            Red delete button with confirm modal
│   ├── CustomLink.tsx              Type-safe text link (wraps TanStack Link)
│   ├── LinkButton.tsx              Type-safe button link
│   ├── ViewModeMenu.tsx            Default/Template/JSON view switcher
│   ├── MetaCell.tsx                Key-value display cell
│   ├── MultilineText.tsx           Preserves newlines in plain text
│   ├── TextBadge.tsx               Styled text badge
│   ├── SpaceSlug.tsx               Monospace slug display
│   └── Username.tsx                Username display
│
├── errors/
│   └── AppError.ts                 Error class: parses HTTP/unknown errors into typed codes
│
├── hooks/
│   └── useImageWithRetry.ts        Image src with exponential retry backoff
│
├── templates/                      LiquidJS template engine
│   ├── index.ts                    Liquid instance + render function
│   ├── filters.ts                  Custom Liquid filters
│   ├── markdown.ts                 Markdown rendering for templates
│   └── imageRetry.ts               Image retry logic for templates
│
├── types/
│   ├── openapi.gen.ts              Auto-generated from backend OpenAPI spec
│   └── index.ts                    Re-exports + custom types
│
├── utils/
│   ├── datetime.ts                 Date/time formatting helpers
│   ├── filters.ts                  Filter condition utilities
│   ├── format.ts                   General formatting (numbers, strings)
│   └── recurrence.ts               Recurrence schedule helpers
│
├── styles/
│   └── templates.css               CSS classes for Liquid templates (mirrors Mantine)
│
├── routes/                         All route files (virtual file routes)
│   ├── routes.ts                   Route tree definition
│   ├── root.layout.tsx             Root layout (QueryClient context, 404)
│   ├── auth.layout.tsx             Auth layout (Header, Footer, ErrorBoundary)
│   ├── login.page.tsx              Login page
│   ├── index/                      Home page
│   ├── s/                          Note viewing routes (/s/:slug/...)
│   │   └── _slug_/                 Space routes by slug
│   ├── spaces/                     Space management routes (/spaces/...)
│   │   ├── layout.tsx              Permission guard
│   │   ├── -shared/                Shared: SpaceTabs, SpaceMenu
│   │   └── _slug_/                 Per-space: fields, filters, templates, settings, etc.
│   └── admin/                      Admin routes (/admin/...)
│       ├── layout.tsx              Admin guard (is_admin check)
│       ├── users/                  User management
│       ├── telegram/               Telegram tasks & mirrors
│       └── pending-attachments/    Attachment review
│
└── routeTree.gen.ts                Auto-generated route tree (do not edit)
```

### Route file conventions

| Pattern                          | Meaning                                                       |
| -------------------------------- | ------------------------------------------------------------- |
| `page.tsx` / `name.page.tsx`     | Page component                                                |
| `layout.tsx` / `name.layout.tsx` | Layout wrapper                                                |
| `-local/`                        | Components scoped to one page                                 |
| `-shared/`                       | Components shared across sibling pages                        |
| `_param_/`                       | Dynamic route parameter (shell-safe alternative to `$param/`) |

## Further Reading

See [`docs/frontend.md`](../../docs/frontend.md) for detailed documentation on data layer patterns, component guidelines, UI patterns, and custom templates.

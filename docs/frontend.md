# Frontend Documentation

## Tech Stack

- **React 19** + **TypeScript 5** + **Vite 7**
- **Mantine 8** (UI components, forms, notifications)
- **TanStack Router** (virtual file routes, type-safe)
- **TanStack Query** (server state, caching)
- **ky** (HTTP client)
- **Zod** (validation) + **mantine-form-zod-resolver**
- **openapi-typescript** (type generation from OpenAPI)


---

## Project Structure

### App Structure

Single frontend application at `apps/frontend/` serving both user and admin routes. Admin pages live under `/admin/*` with a layout guard checking `currentUser.username === "admin"`.

### Routes Organization (Virtual File Routes)

We use **virtual file routes** instead of file-based routing. The `$` character in file-based routing (e.g., `$slug/`) causes shell escaping issues with AI tools. Virtual routes define the tree in `routes.ts` while files use shell-safe names.

#### Naming Conventions

| Type | Simple | With `-local/` or `-shared/` |
|------|--------|------------------------------|
| Layout | `name.layout.tsx` | `name/layout.tsx` |
| Page | `name.page.tsx` | `name/page.tsx` |
| Index | `index.page.tsx` | `index/page.tsx` |
| Param folder | `_param_/` | — |

**Default to flat files.** Only promote to a directory (`name/page.tsx`) when the page needs `-local/` or `-shared/` sub-components. A standalone page must be `name.page.tsx`, not `name/index/page.tsx`.

#### Structure Example

```
src/routes/
├── routes.ts                  # Route tree definition
├── root.layout.tsx
├── auth.layout.tsx
├── login.page.tsx             # /login
│
├── index/                     # / (has components)
│   ├── page.tsx
│   └── -components/
│
└── s/_slug_/
    ├── index/                 # /s/:slug (has components)
    │   ├── page.tsx
    │   └── -components/
    ├── new.page.tsx           # /s/:slug/new
    └── _noteNumber_/
        ├── index/             # /s/:slug/:noteNumber
        │   ├── page.tsx
        │   └── -components/
        └── edit.page.tsx      # /s/:slug/:noteNumber/edit
```

#### routes.ts Example

```typescript
import { rootRoute, route, layout, index } from '@tanstack/virtual-file-routes'

export const routes = rootRoute('root.layout.tsx', [
  route('/login', 'login.page.tsx'),
  layout('auth.layout.tsx', [
    index('index/page.tsx'),
    route('/s/$slug', [
      index('s/_slug_/index/page.tsx'),
      route('/new', 's/_slug_/new.page.tsx'),
      route('/$noteNumber', [
        index('s/_slug_/_noteNumber_/index/page.tsx'),
        route('/edit', 's/_slug_/_noteNumber_/edit.page.tsx'),
      ]),
    ]),
  ]),
])
```

### Import Paths

Use `@/` alias for deep imports (2+ levels up).

```typescript
// ✅ Use @/ for deep imports
import { FieldInput } from "@/components/FieldInput"

// ✅ Relative for 1 level up or same directory
import { api } from "../api"
import { Foo } from "./Foo"

// ❌ Bad - too many levels
import { FieldInput } from "../../../../components/FieldInput"
```


---

## Setup

### Type Generation from OpenAPI

Types auto-generated from backend OpenAPI spec via `openapi-typescript`:

```bash
pnpm --filter @spacenote/frontend openapi
```

```
apps/frontend/src/types/
├── openapi.gen.ts   # Auto-generated from OpenAPI
└── index.ts         # Re-exports + custom types
```

Usage:
```typescript
import type { LoginRequest, User } from "@/types"
```


---

## Data Layer

### API Structure

```
apps/frontend/src/api/
├── queries.ts      # Query definitions (queryOptions)
├── mutations.ts    # Mutation hooks (useMutation)
├── cache.ts        # Cache read hooks (useSuspenseQuery wrappers)
├── httpClient.ts   # ky instance
└── index.ts        # Exports api object
```

Access via unified `api` object:
```typescript
import { api } from "@/api"

api.queries.listSpaces()      // Query options
api.mutations.useCreateNote() // Mutation hook
api.cache.useSpace(slug)      // Cache read hook
```

**Separation of concerns:**

`mutations.ts` responsibilities:
- ✅ HTTP requests
- ✅ Cache invalidation (`queryClient.invalidateQueries`)
- ❌ Navigation, notifications, form resets

Component responsibilities:
- ✅ Navigation (`useNavigate`)
- ✅ Notifications (`notifications.show`)
- ✅ Form state, custom `onSuccess` logic

```typescript
// api/mutations.ts - data only
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => httpClient.post("api/v1/auth/login", { json: data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
    },
  })
}

// Component - UI logic
loginMutation.mutate(values, {
  onSuccess: () => {
    notifications.show({ message: "Logged in" })
    navigate({ to: "/" })
  },
})
```

### Data Loading

**Standard pattern** - prefetch in loader, read in component:

```typescript
// Route definition
export const Route = createFileRoute("/s/$slug/$noteNumber")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      api.queries.getNote(params.slug, Number(params.noteNumber))
    )
  },
  component: NoteDetailPage,
})

// Component
function NoteDetailPage() {
  const { slug, noteNumber } = Route.useParams()
  const { data: note } = useSuspenseQuery(
    api.queries.getNote(slug, Number(noteNumber))
  )
  // data is guaranteed, no loading state needed
}
```

Why this pattern:
- `ensureQueryData` in loader → prefetch during navigation (no waterfall)
- `useSuspenseQuery` in component → read from cache + subscribe to updates
- No "flash of loading" - data displays immediately
- **Always `useSuspenseQuery`, never `useQuery`** — loading/error states handled by route's Suspense and ErrorBoundary, no need to handle in each component

### Cache Hooks

Global data is preloaded once in `_auth/route.tsx`:

**web app:**
```typescript
loader: async ({ context }) => {
  await context.queryClient.ensureQueryData(api.queries.listSpaces())
}
```

**admin app:**
```typescript
loader: async ({ context }) => {
  await Promise.all([
    context.queryClient.ensureQueryData(api.queries.listUsers()),
    context.queryClient.ensureQueryData(api.queries.listSpaces()),
  ])
}
```

Child components read via cache hooks without additional requests:

```typescript
const space = api.cache.useSpace(slug)
const currentUser = api.cache.useCurrentUser()
const users = api.cache.useUsers()  // admin only
```

**Available hooks:**
- `useCurrentUser()` → `User`
- `useUsers()` → `User[]` (admin)
- `useSpaces()` → `Space[]`
- `useSpace(slug)` → `Space`
- `useUser(username)` → `User` (admin)

These hooks use `useSuspenseQuery` internally, but suspense doesn't trigger — data is already in cache.

**Important:** Routes under `/_auth/` should NOT add loaders for global data. Use cache hooks directly:

```typescript
// ❌ Wrong - redundant, data already in cache
export const Route = createFileRoute("/_auth/spaces/$slug/members")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(api.queries.listSpaces())
  },
})

// ✅ Correct - no loader, use cache hook
export const Route = createFileRoute("/_auth/spaces/$slug/members")({
  component: SpaceMembersPage,
})
```

Only add loaders for route-specific data not in global cache (notes, comments, etc).

### Query Keys & Invalidation

```typescript
// Pagination params at the end
queryKey: ["spaces", slug, "notes", noteNumber, "comments", { page, limit }]

// Invalidation WITHOUT pagination (affects all pages)
invalidateQueries({ queryKey: ["spaces", slug, "notes", noteNumber, "comments"] })
```

Pagination params (`page`, `limit`) excluded from invalidation — all pages refresh.
Filter params (`search`, `status`) should be included if you only want to invalidate that specific filter.


---

## Routing

### Route Protection

```typescript
export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context, location }) => {
    try {
      const currentUser = await context.queryClient.ensureQueryData(
        api.queries.currentUser()
      )
      return { currentUser }
    } catch (error) {
      const appError = AppError.fromUnknown(error)
      if (appError.code === "unauthorized") {
        throw redirect({ to: "/login", search: { redirect: location.href } })
      }
      throw error
    }
  },
})
```

### Search Params Validation

```typescript
export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
})
```

### Error/Loading States

```typescript
export const Route = createFileRoute("/_auth")({
  errorComponent: ErrorScreen,
  pendingComponent: LoadingScreen,
})
```

### Navigation

Use type-safe navigation components.

**Text links → CustomLink:**
```tsx
import { CustomLink } from "@/components/CustomLink"

<CustomLink to="/s/$slug" params={{ slug }}>View space</CustomLink>
```

**Button links → LinkButton:**
```tsx
import { LinkButton } from "@/components/LinkButton"

<LinkButton to="/s/$slug/new" params={{ slug }}>New Note</LinkButton>
```

**Programmatic navigation → useNavigate:**
```tsx
void navigate({ to: "/s/$slug", params: { slug } })
```

❌ **Don't use raw Link with Mantine components:**
```tsx
// Wrong - loses type safety for params
<Button component={Link} to="/s/$slug" params={{ slug }}>
```


---

## Components

### Organization

#### Placement Rules

| Where | When |
|-------|------|
| `src/components/` | Used across **unrelated** parts of the app |
| `-shared/` | Used only within **one route branch** (e.g., all of `/spaces/*`) |
| `-local/` | Used by **one** page or layout |

Key principle: **`src/components/` is the global scope.** If a component is only used within one route branch, put it in that branch's `-shared/`, not in `components/`.

Names reflect **scope**, not content — `-local/` and `-shared/` can contain components, hooks, utils, types.

**`-local/` rule:**
- Must be inside a page folder (e.g., `index/-local/` for `index/page.tsx`)
- Never place where ownership is ambiguous

**`-shared/` rule:**
- Available to pages at the same level AND in child folders
- Use when multiple pages in a feature area need the same code

**When to use folder structure:**
- Page needs local code → `name/page.tsx` + `name/-local/`
- Simple page → `name.page.tsx`

#### Directory Modules for Complex Components

When a component has private sub-components too large to inline, convert to a directory with `index.tsx` + private files. External imports stay unchanged (`@/components/Foo` resolves to `@/components/Foo/index.tsx`).

```
components/FieldInput/
  index.tsx                 ← public, the main component
  ImageFieldInput.tsx       ← private sub-component
  MarkdownEditor.tsx        ← private sub-component
```

This pattern applies equally to `components/`, `-local/`, and `-shared/`.

#### Example

```
fields/
├── index/
│   ├── page.tsx
│   └── -local/              ← only for index/page.tsx
│       └── FieldsTable.tsx
├── new.page.tsx             ← imports from -shared/
├── _fieldName_/
│   └── edit.page.tsx        ← imports from ../-shared/
└── -shared/                 ← for new.page, edit.page, children
    ├── StringFieldConfig.tsx
    ├── fieldFormUtils.ts
    └── useFieldValidation.ts
```

### Encapsulation

**Principle:** Minimize props, maximize encapsulation. Components should own their logic.

❌ **Passing callbacks:**
```tsx
<UsersTable users={users} onDeleteClick={(username) => setDeleteUser(username)} />
```

✅ **Self-contained:**
```tsx
// Component owns delete logic with mutation and modal inside
<UsersTable users={users} />
```

Keep parent components simple - they coordinate, not implement.

### Layout Simplicity

Avoid unnecessary nested containers.

❌ **Unnecessary nesting:**
```tsx
<Box style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
  <Container size="lg">
    <Header />
    <Box component="main" style={{ flex: 1 }}>
      <Outlet />
    </Box>
  </Container>
</Box>
```

✅ **Simplified:**
```tsx
<Container size="lg">
  <Flex direction="column" mih="100vh">
    <Header />
    <Box component="main" flex={1}>
      <Outlet />
    </Box>
  </Flex>
</Container>
```


---

## UI Patterns

### Forms

**Always use `useForm` for form state** — never raw `useState`. Mantine's `useForm` handles:
- Validation with Zod via `zod4Resolver`
- Dirty tracking and reset
- Proper re-initialization from props

❌ **Wrong:**
```tsx
const [value, setValue] = useState(initialValue)
```

✅ **Correct:**
```tsx
const form = useForm({
  initialValues: { value: initialValue },
  validate: zod4Resolver(schema),
})
```

**Mantine Form + Zod:**
```typescript
const loginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(2),
})

const form = useForm({
  initialValues: { username: "", password: "" },
  validate: zod4Resolver(loginSchema),
})

const handleSubmit = form.onSubmit((values) => {
  mutation.mutate(values, {
    onSuccess: () => {
      notifications.show({ message: "Success" })
      navigate({ to: "/" })
    },
  })
})
```

**Form integration:**
```tsx
<TextInput {...form.getInputProps("username")} />
{mutation.error && <ErrorMessage error={mutation.error} />}
<Button type="submit" loading={mutation.isPending}>Submit</Button>
```

### Modals

**Controlled modals** (complex forms, custom UI):
```tsx
const [opened, setOpened] = useState(false)
<CreateUserModal opened={opened} onClose={() => setOpened(false)} />
```

**Imperative confirmations** (simple yes/no):
```tsx
import { modals } from "@mantine/modals"

<Button onClick={() => {
  modals.openConfirmModal({
    title: "Delete User",
    children: `Are you sure you want to delete "${username}"?`,
    labels: { confirm: "Delete", cancel: "Cancel" },
    confirmProps: { color: "red" },
    onConfirm: () => deleteMutation.mutate(username)
  })
}}>Delete</Button>
```

No state, no modal component, no props. Use for simple confirmations.

### Error Handling

**AppError class** centralizes error parsing:
```typescript
export class AppError extends Error {
  readonly code: ErrorCode  // "unauthorized" | "not_found" | ...

  static fromUnknown(error: unknown): AppError {
    if (error instanceof HTTPError) {
      return new AppError(codeFromStatus(error.response.status), message)
    }
    // ... other cases
  }

  get title(): string {
    return errorTitleByCode[this.code]
  }
}
```

**ErrorBoundary** catches render errors:
```tsx
<ErrorBoundary
  resetKey={location.pathname}
  onUnauthorized={() => navigate({ to: "/login" })}
>
  <Outlet />
</ErrorBoundary>
```

**Route-level error handling:**
```typescript
errorComponent: ({ error }) => {
  const appError = AppError.fromUnknown(error)
  return <Alert title={appError.title}>{appError.message}</Alert>
}
```

**Mutation error display:**
```tsx
{mutation.error && <ErrorMessage error={mutation.error} />}
```

### Naming Conventions

**Mutations:** Always use `Mutation` suffix for mutation variables:
```typescript
// ✅ Good
const loginMutation = api.mutations.useLogin()
const createNoteMutation = api.mutations.useCreateNote(slug)

// ❌ Bad
const login = api.mutations.useLogin()
const createNote = api.mutations.useCreateNote(slug)
```


---

## Custom Templates (LiquidJS)

### Overview

Spaces can have custom templates for rendering pages. Templates are stored in `space.templates` and configured via admin panel.

**Technology:** [LiquidJS](https://liquidjs.com/) — safe, logic-less template engine.

### Template Types

| Template Key | Page | Context |
|--------------|------|---------|
| `web:note:detail` | `/s/{slug}/{noteNumber}` | `note`, `space` |
| `web:note:list:{filter}` | `/s/{slug}?filter={filter}` | `notes`, `space` |

**Examples:**
```
web:note:detail        → /s/mf-tasks/7
web:note:list:all      → /s/mf-tasks?filter=all
web:note:list:active   → /s/mf-tasks?filter=active
web:note:list:my-tasks → /s/mf-tasks?filter=my-tasks
```

### Styling Approach

Templates render HTML that should visually match Mantine components. We achieve this through CSS classes in `apps/frontend/src/styles/templates.css`.

**Principle:** Write HTML as if using Mantine components.

```jsx
// Mantine (React)
<Stack gap="md">
  <Title order={2}>{note.title}</Title>
  <Badge color="blue">{note.status}</Badge>
</Stack>
```

```liquid
<!-- Liquid template -->
<div class="Stack gap-md">
  <h2 class="Title">{{ note.title }}</h2>
  <span class="Badge color-blue">{{ note.status }}</span>
</div>
```

### CSS Implementation

`templates.css` uses **Mantine CSS variables** to ensure visual consistency:

```css
.Stack {
  display: flex;
  flex-direction: column;
}

.gap-md { gap: var(--mantine-spacing-md); }

.Badge {
  display: inline-flex;
  padding: 0 var(--mantine-spacing-xs);
  font-size: var(--mantine-font-size-xs);
  border-radius: var(--mantine-radius-sm);
  background: var(--mantine-color-blue-light);
  color: var(--mantine-color-blue-light-color);
}
```

**Key Mantine CSS variables:**
- Spacing: `--mantine-spacing-{xs|sm|md|lg|xl}`
- Colors: `--mantine-color-{color}-{shade}`, `--mantine-color-dimmed`
- Typography: `--mantine-font-size-{xs|sm|md|lg|xl}`
- Radius: `--mantine-radius-{xs|sm|md|lg|xl}`
- Theme-aware: `--mantine-color-body`, `--mantine-color-text`, `--mantine-color-default-border`

Dark/light themes work automatically via CSS variables.

### CSS Class Naming Convention

**Components** — PascalCase, matching Mantine component names:
```
Stack, Group, Card, Badge, Title, Text, Button, Table, Anchor
```

**Modifiers** — lowercase `prop-value`:
```
gap-xs, gap-sm, gap-md, gap-lg, gap-xl
color-blue, color-red, color-dimmed
size-xs, size-sm, size-md, size-lg
justify-center, justify-between
align-center, align-start
p-sm, p-md, p-lg
```

### Mantine → HTML Mapping

| Mantine | HTML |
|---------|------|
| `<Stack gap="md">` | `<div class="Stack gap-md">` |
| `<Group justify="space-between">` | `<div class="Group justify-between">` |
| `<Title order={2}>` | `<h2 class="Title">` |
| `<Text size="sm" c="dimmed">` | `<span class="Text size-sm color-dimmed">` |
| `<Badge color="blue">` | `<span class="Badge color-blue">` |
| `<Card shadow="sm" padding="lg">` | `<div class="Card shadow-sm p-lg">` |
| `<Table>` | `<table class="Table">` |
| `<Anchor>` | `<a class="Anchor">` |

### Example: Note List Template

```liquid
<div class="Stack gap-md">
  {% for note in notes %}
    <a href="/s/{{ space.slug }}/{{ note.number }}" class="Card">
      <div class="Group justify-between">
        <span class="Text fw-500">{{ note.title }}</span>
        <span class="Badge color-blue">{{ note.fields.status }}</span>
      </div>
    </a>
  {% endfor %}
</div>
```

### Files

- `apps/frontend/src/styles/templates.css` — CSS classes
- `apps/frontend/src/templates/` — LiquidJS renderer

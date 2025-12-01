# Frontend Documentation

## Tech Stack

- **React 19** + **TypeScript 5** + **Vite 7**
- **Mantine 8** (UI components, forms, notifications)
- **TanStack Router** (file-based routing, type-safe)
- **TanStack Query** (server state, caching)
- **ky** (HTTP client)
- **Zod** (validation) + **mantine-form-zod-resolver**
- **openapi-typescript** (type generation from OpenAPI)


---

## Project Structure

### Monorepo Structure

```
apps/
├── admin/              # Admin panel
└── web/                # User-facing app

packages/
└── common/             # @spacenote/common - types, API layer, components, utilities
```

### App Structure

```
src/
├── components/         # App-specific reusable components
├── routes/             # File-based routing (TanStack Router)
│   ├── __root.tsx      # Root layout
│   ├── _auth/          # Authenticated routes
│   │   ├── route.tsx   # Auth layout + data preloading
│   │   ├── -components/  # Route-specific components
│   │   └── users/
│   │       ├── route.tsx
│   │       └── -components/
│   └── login.tsx       # Public route
├── main.tsx
└── routeTree.gen.ts    # Auto-generated
```

**Route structure:**
- Simple routes: `login.tsx` (single file)
- Routes with components: `users/route.tsx` + `users/-components/` (folder)

### Import Paths

**Apps (`apps/web`, `apps/admin`):** Use `@/` alias for deep imports (2+ levels up).

```typescript
// ✅ In apps - use @/ for deep imports
import { FieldInput } from "@/components/FieldInput"

// ✅ Relative for 1 level up or same directory
import { api } from "../api"
import { Foo } from "./Foo"

// ❌ Bad - too many levels
import { FieldInput } from "../../../../components/FieldInput"
```

**Packages (`@spacenote/common`):** Always use relative imports. Packages are standalone - `@/` aliases break when consumed by apps with different tsconfig paths.


---

## Setup

### App Bootstrap

Both apps use `@spacenote/common/app` for initialization:

```typescript
// main.tsx
import { createAppRouter, renderApp } from "@spacenote/common/app"
import { initHttpClient } from "@spacenote/common/api"
import { routeTree } from "./routeTree.gen"

initHttpClient("admin")  // or "web"
renderApp(createAppRouter(routeTree))
```

- `createAppRouter(routeTree)` - creates TanStack Router with QueryClient context
- `renderApp(router)` - renders React app with all providers (Mantine, Query, Router)

### Type Generation from OpenAPI

Types auto-generated from backend OpenAPI spec via `openapi-typescript`:

```bash
pnpm --filter @spacenote/common generate
# or
just common-generate
```

```
packages/common/src/types/
├── openapi.gen.ts   # Auto-generated from OpenAPI
└── index.ts         # Re-exports + custom types
```

Usage:
```typescript
import type { LoginRequest, User } from "@spacenote/common/types"
```


---

## Data Layer

### API Structure

```
packages/common/src/api/
├── queries.ts      # Query definitions (queryOptions)
├── mutations.ts    # Mutation hooks (useMutation)
├── cache.ts        # Cache read hooks (useSuspenseQuery wrappers)
├── httpClient.ts   # ky instance
└── index.ts        # Exports api object
```

Access via unified `api` object:
```typescript
import { api } from "@spacenote/common/api"

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

Use type-safe navigation components from `@spacenote/common/components`.

**Text links → CustomLink:**
```tsx
import { CustomLink } from "@spacenote/common/components"

<CustomLink to="/s/$slug" params={{ slug }}>View space</CustomLink>
```

**Button links → LinkButton:**
```tsx
import { LinkButton } from "@spacenote/common/components"

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

**Route-specific components** → `src/routes/[route]/-components/`
- Used only in that route
- Co-located with route definition

**Reusable components** → `src/components/[category]/`
- Used across multiple routes
- Categories: `errors/`, `ui/`, `navigation/`

**Decision flow:**
1. Used in multiple routes? → `src/components/`
2. Special app-wide purpose (error boundaries, auth)? → `src/components/`
3. Otherwise → `src/routes/[route]/-components/`

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

# Frontend Documentation

## Tech Stack

- **React 19** + **TypeScript 5** + **Vite 7**
- **Mantine 8** (UI components, forms, notifications)
- **TanStack Router** (file-based routing, type-safe)
- **TanStack Query** (server state, caching)
- **ky** (HTTP client)
- **Zod** (validation) + **mantine-form-zod-resolver**
- **openapi-typescript** (type generation from OpenAPI)

## Monorepo Structure

```
apps/
├── admin/              # Admin panel (implemented)
└── web/                # User-facing app (planned)

packages/
└── frontend-common/    # @spacenote/common - types, API layer, components, utilities
```

## Project Structure

```
src/
├── api/                # API layer (queries, mutations, cache, HTTP client)
├── components/         # Reusable components
│   ├── errors/         # ErrorBoundary
│   └── ui/             # General UI (ErrorMessage, etc.)
├── errors/             # AppError class
├── routes/             # File-based routing (TanStack Router)
│   ├── __root.tsx      # Root layout
│   ├── _auth/          # Authenticated routes
│   │   ├── users/      # Route with components (folder structure)
│   │   │   ├── -components/  # Route-specific components
│   │   │   └── route.tsx
│   │   └── route.tsx
│   └── login.tsx       # Simple route (single file)
├── main.tsx
├── router.ts
└── routeTree.gen.ts    # Auto-generated
```

**Route structure:**
- Simple routes: `login.tsx` (single file)
- Routes with components: `users/route.tsx` + `users/-components/` (folder)

## Import Paths

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

## Architecture

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

### Component Organization

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

### Component Encapsulation

**Principle:** Minimize props, maximize encapsulation. Components should own their logic.

❌ **Passing callbacks:**
```tsx
// Parent passes callback
<UsersTable users={users} onDeleteClick={(username) => setDeleteUser(username)} />
```

✅ **Self-contained:**
```tsx
// Component owns delete logic with mutation and modal inside
<UsersTable users={users} />
```

Keep parent components simple - they coordinate, not implement.

### API Layer - Separation of Concerns

**`api/mutations.ts` responsibilities:**
- ✅ HTTP requests
- ✅ Cache invalidation (`queryClient.invalidateQueries`)
- ❌ Navigation, notifications, form resets

**Component responsibilities:**
- ✅ Navigation (`useNavigate`)
- ✅ Notifications (`notifications.show`)
- ✅ Form state, custom `onSuccess` logic

**Example:**
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

### Type Generation from OpenAPI

**Package:** `@spacenote/common`

Types auto-generated from backend OpenAPI spec via `openapi-typescript`:
```bash
pnpm --filter @spacenote/common generate
# or
just common-generate
```

**Structure:**
```
packages/frontend-common/src/types/
├── openapi.gen.ts   # Auto-generated from OpenAPI
└── index.ts         # Re-exports + custom types
```

**Usage:**
```typescript
import type { LoginRequest, User } from "@spacenote/common"
```

All frontend apps use these types for type-safe API communication.

### Routing Patterns (TanStack Router)

**Route protection via `beforeLoad`:**
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

**Search params validation:**
```typescript
export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
})
```

**Error/loading states per route:**
```typescript
export const Route = createFileRoute("/_auth")({
  errorComponent: ErrorComponent,
  pendingComponent: LoadingComponent,
})
```

### Data Loading (TanStack Query + Router)

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

**Exception: parent-loaded cache data**

When parent route already loads shared data, child routes can read directly from cache:
```typescript
// _auth/route.tsx loads spaces in loader
loader: async ({ context }) => {
  await context.queryClient.ensureQueryData(api.queries.listSpaces())
}

// Child route reads from cache (no loader needed for this data)
function SpacePage() {
  const space = api.cache.useSpace(slug)  // reads from already-loaded cache
}
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

### Form Handling Patterns

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

### Modal Patterns

**Controlled modals** (complex forms, custom UI):
```tsx
const [opened, setOpened] = useState(false)
<CreateUserModal opened={opened} onClose={() => setOpened(false)} />
```

This is the standard React pattern. `useState(false)` + `opened`/`onClose` props is the minimum for controlled components.

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

### Error Handling Patterns

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

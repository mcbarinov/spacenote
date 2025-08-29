# SpaceNote Frontend Architecture

## System Overview

SpaceNote frontend is a single-page application built on:

- **React 19** - UI framework with strict mode
- **TypeScript 5.8** - Type-safe development
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **Tailwind CSS v4** - Utility-first styling
- **React Router v7** - Client-side routing

## Architecture Layers

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components (AuthLayout)
│   │   ├── pages/           # Page components (*Page.tsx)
│   │   └── ui/              # Reusable UI components (shadcn/ui)
│   ├── contexts/            # React Context providers
│   │   └── auth/            # Authentication context
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Core utilities
│   │   ├── api.ts           # API client with flat methods
│   │   ├── http-client.ts   # HTTP client configuration
│   │   ├── queries.ts       # TanStack Query hooks
│   │   └── utils.ts         # Helper functions
│   ├── types/               # TypeScript definitions
│   │   ├── generated.ts     # OpenAPI generated types
│   │   └── index.ts         # Type exports
│   ├── App.tsx              # Root component with providers
│   ├── router.tsx           # Route configuration
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
└── scripts/                 # Build scripts
```

### Architectural Decision: No Feature-Based Architecture

We consciously avoid Feature-Based Architecture. We use simple type-based organization (components, hooks, lib) instead of feature folders. All API methods stay in `lib/api.ts`, all queries in `lib/queries.ts`. Keep it simple.

## Routing

Browser-based routing with authentication checks:

```typescript
/ (root)
├── /login                      # Public route with built-in auth check
└── / (protected)               # Private routes wrapped in AuthLayout
    ├── /                       # Home page
    ├── /s/:slug                # Note list for a space
    ├── /s/:slug/:number        # Note detail view
    ├── /s/:slug/new            # Create new note
    ├── /spaces/new             # Create new space
    ├── /spaces/:slug/members   # Manage space members
    ├── /spaces/:slug/fields    # Manage space fields
    ├── /spaces/:slug/fields/new # Add new field
    ├── /spaces/:slug/filters   # Manage space filters
    ├── /spaces/:slug/templates # Manage space templates
    ├── /spaces/:slug/settings  # Space settings
    └── /change-password        # Change password (TODO)
```

**Route Protection:**
- `AuthLayout` - Wraps all protected routes, redirects to login if not authenticated
- `LoginPage` - Contains built-in check, redirects to home if authenticated
- Auth state managed via `useAuth` hook and `AuthContext`

## State Management

### Authentication State
Context API manages auth state:
- User session stored in localStorage (auth_token, username)
- `AuthProvider` wraps application in `App.tsx`
- `useAuth` hook provides login/logout/isAuthenticated

### Server State
TanStack Query handles API data:
- Automatic caching and invalidation
- Background refetching
- Optimistic updates
- Error/loading states

## API Integration

### HTTP Client
Ky-based client with automatic auth:
```typescript
httpClient = ky.create({
  prefixUrl: "http://localhost:3101",  // AI agent port
  hooks: { beforeRequest: [addAuthToken] }
})
```

### Type Generation
OpenAPI schema → TypeScript types:
1. `pnpm generate:fetch` - Downloads OpenAPI spec
2. `pnpm generate:types` - Generates TypeScript types
3. Types available in `types/generated.ts`

### API Layer Architecture

**Critical Architecture Rule**: Components NEVER import or use `api` directly. All data fetching goes through `lib/queries.ts`.

#### Three-Layer Structure:
1. **HTTP Client** (`lib/http-client.ts`) - Raw HTTP configuration
2. **API Client** (`lib/api.ts`) - Typed API methods, flat structure
3. **Query Layer** (`lib/queries.ts`) - TanStack Query hooks used by components

#### Design Principles:
- **Components use only queries.ts** - Provides caching, error handling, and state management
- **Queries use queryOptions** - Consistent caching configuration
- **Mutations are custom hooks** - Built-in error handling, toasts, and navigation
- **Single exception: Auth** - `AuthProvider` can use `api.login/logout` directly

```typescript
// ✅ CORRECT: Component uses query hook
import { spacesQueryOptions, useCreateSpaceMutation } from "@/lib/queries"
const { data } = useSuspenseQuery(spacesQueryOptions())
const mutation = useCreateSpaceMutation()

// ❌ WRONG: Component imports api directly
import { api } from "@/lib/api"
await api.createSpace(data)
```

This architecture ensures:
- Consistent error handling across the app
- Centralized cache invalidation logic
- Better TypeScript inference
- Easier testing (mock only queries.ts)
- Clear separation of concerns

### Mutation Pattern

**Critical Rule**: Separation of concerns between queries and components.

#### Mutation Architecture Rules:
1. **Mutations handle ONLY data operations** - Cache invalidation via `queryClient.invalidateQueries()`
2. **UI feedback belongs in components** - Toast notifications, navigation, form resets
3. **Error handling is split**:
   - Mutations: Return errors to component
   - Components: Display errors via toast/UI
4. **Success handling is split**:
   - Mutations: Invalidate related queries
   - Components: Show success feedback, navigate, reset forms

#### Correct Implementation:

```typescript
// ✅ CORRECT: In queries.ts - Only cache invalidation
export const useUpdateTitleMutation = (slug: string) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (title: string) => api.updateTitle(slug, title),
    onSuccess: () => {
      // ONLY cache invalidation
      void queryClient.invalidateQueries({ queryKey: ["space", slug] })
    },
  })
}

// ✅ CORRECT: In component - UI feedback
const handleSubmit = (data: FormData) => {
  mutation.mutate(data, {
    onSuccess: () => {
      toast.success("Title updated successfully")
      navigate("/spaces")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update")
    },
  })
}
```

#### Incorrect Implementation:

```typescript
// ❌ WRONG: In queries.ts - Contains UI feedback
export const useUpdateTitleMutation = (slug: string) => {
  return useMutation({
    mutationFn: (title: string) => api.updateTitle(slug, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["space", slug] })
      toast.success("Updated!")  // ❌ UI feedback should be in component
    },
    onError: () => {
      toast.error("Failed!")  // ❌ UI feedback should be in component
    },
  })
}

// ❌ WRONG: In component - No feedback handling
const handleSubmit = (data: FormData) => {
  mutation.mutate(data)  // ❌ Missing success/error callbacks
}
```

This pattern ensures:
- **Reusable mutations** - Same mutation can show different messages in different contexts
- **Component control** - Each component decides its own UI feedback
- **Flexibility** - Components can add context-specific logic (navigation, form resets)
- **Testing** - Mutations can be tested without UI dependencies

## Component System

### UI Components (shadcn/ui)
Pre-styled, accessible components:
- Form controls (Input, Button, Textarea)
- Layout (Card, Dialog, Table)
- Feedback (Badge, Skeleton, Sonner toasts)
- Built with Radix UI primitives
- Styled with Tailwind CSS

### Page Components
Route-specific components organized in `pages/` directory:
- `LoginPage` - Authentication form with built-in auth check
- `HomePage` - Dashboard/landing page
- `spaces/CreateSpace` - Create new space form
- `spaces/fields/CreateField` - Add field to space
- `spaces/fields/FieldList` - List and manage space fields
- `spaces/members/MemberList` - Manage space members
- `spaces/filters/FilterList` - Manage space filters
- `spaces/templates/TemplateList` - Manage space templates
- `spaces/settings/SpaceSettings` - Space configuration
- `notes/NoteList` - List notes in a space
- `notes/NoteDetail` - View note details and comments
- `notes/CreateNote` - Create new note in space

### Layout Components
- `AuthLayout` - Main layout for authenticated pages with header, navigation, and footer
- Toaster component configured globally in `App.tsx`

### Component Patterns
- CVA for variant styling
- clsx for conditional classes

## Styling

### Tailwind CSS v4
- Utility-first approach
- Custom theme in CSS variables
- Dark mode support via next-themes
- Animations with tw-animate-css

### CSS Architecture
- Global styles in `index.css`
- Component styles via Tailwind utilities
- No CSS modules or styled-components

## Build Configuration

### Vite Configuration
- React plugin for JSX/TSX
- Tailwind CSS plugin
- Path alias `@/` → `./src/`
- TypeScript paths resolution

### Development Ports
- **Port 3000**: Human developers (`pnpm dev`)
- **Port 3001**: AI agents (`pnpm dev:agent`)
- Backend connection defaults to port 3101

### Scripts
- `dev` - Development server (port 3000)
- `dev:agent` - Agent development (port 3001)
- `build` - Production build
- `lint` - ESLint checks
- `format` - Prettier formatting
- `generate` - Update API types

## Form Handling

### Architecture Pattern

All forms in SpaceNote follow a consistent architecture using:
- **react-hook-form** - Form state management and validation
- **zod** - Schema validation with TypeScript inference
- **@hookform/resolvers** - Integration between zod and react-hook-form
- **shadcn Form components** - Consistent UI components with built-in accessibility

### Standard Form Structure

```typescript
// 1. Define Zod schema for validation
const formSchema = z.object({
  field1: z.string().min(1, "Required"),
  field2: z.boolean().default(false),
  // Add refinements for complex validation
}).refine(
  (data) => customValidation(data),
  { message: "Custom error", path: ["field1"] }
)

// 2. Infer TypeScript type from schema
type FormData = z.infer<typeof formSchema>

// 3. Initialize form with useForm hook
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { /* ... */ }
})

// 4. Use shadcn Form components for rendering
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="field1"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Key Principles

1. **Type Safety**: Zod schemas provide runtime validation and TypeScript types
2. **Consistent UI**: Always use shadcn Form components for uniform styling and behavior
3. **Error Handling**: FormMessage automatically displays validation errors
4. **Accessibility**: Form components include proper ARIA attributes
5. **Dynamic Fields**: Use `form.watch()` to conditionally render fields based on other values

### Advanced Patterns

#### Dynamic Validation
```typescript
const schema = z.object({
  type: z.enum(["A", "B"]),
  value: z.string().optional(),
}).refine(
  (data) => data.type === "A" ? !!data.value : true,
  { message: "Value required for type A", path: ["value"] }
)
```

#### Conditional Fields
```typescript
const watchType = form.watch("type")
return (
  <>
    {watchType === "special" && (
      <FormField name="conditionalField" />
    )}
  </>
)
```

### Examples in Codebase
- **Simple form**: `SpaceNewPage` - Basic form with text inputs
- **Complex form**: `SpaceFieldNewPage` - Dynamic fields, conditional validation, multiple field types

## Error Handling

- API errors caught by TanStack Query
- Toast notifications via Sonner
- Form validation errors from Zod
- Network errors handled by Ky

## Authentication Flow

1. User submits credentials to `/login`
2. API returns auth_token
3. Token stored in localStorage
4. HTTP client adds token to headers
5. Protected routes check auth state
6. Logout clears token and redirects

## Type Safety

End-to-end type safety:
- OpenAPI spec defines API contract
- Generated types for all endpoints
- Zod schemas for runtime validation
- TypeScript strict mode enabled
- **Type Mapping**: Frontend maps backend view model names to clean types in `types/index.ts`:
  - `NoteView` → `Note`
  - `SpaceView` → `Space` 
  - `CommentView` → `Comment`
  - Frontend code uses clean names without "View" suffix
  - No ObjectId types exposed to frontend
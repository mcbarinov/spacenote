# SpaceNote Frontend Architecture

## Overview

SpaceNote frontend is built with modern React technologies and follows a **secure-by-default** authentication pattern inspired by backend middleware systems. All routes are automatically protected except `/login`, ensuring robust security without developer overhead.

## Technology Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety throughout the application
- **TanStack Router** - File-based routing with type-safe parameters
- **TanStack Query** - Server state management with suspense integration
- **Tailwind CSS v4** - Utility-first styling
- **Ky** - Modern HTTP client with hooks
- **Vite** - Fast development and build tooling
- **shadcn/ui** - Accessible UI component library

## Authentication Architecture

### Secure-by-Default Pattern

The application uses a **global authentication middleware** pattern that protects all routes by default:

```typescript
// Root route automatically protects all routes except /login
export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context, location }) => {
    if (location.pathname === "/login") {
      return // Allow login page
    }
    
    // All other routes require authentication
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
})
```

### Authentication Hooks

- **`useAuth()`** - General authentication hook (returns `user: User | null`)
- **`useAuthUser()`** - Protected routes hook (returns `user: User` - guaranteed non-null)

The `useAuthUser()` hook eliminates optional chaining in protected routes, enabling clean code like:

```typescript
function Header() {
  const { user, logout } = useAuthUser() // user is guaranteed to exist
  return <span>Welcome, {user.username}</span> // No optional chaining needed
}
```

### HTTP Client Integration

The HTTP client automatically handles authentication:

```typescript
export const httpClient = ky.create({
  prefixUrl: "/api",
  hooks: {
    beforeRequest: [(request) => {
      const sessionId = getStoredSessionId()
      if (sessionId) {
        request.headers.set("X-Session-Id", sessionId)
      }
    }],
    afterResponse: [(_request, _options, response) => {
      if (response.status === 401) {
        clearAuthData()
        window.dispatchEvent(new CustomEvent("auth:logout"))
      }
    }],
  },
})
```

## Component Architecture

### Smart Layout System

Routes automatically receive the appropriate layout:

- **Login page** (`/login`) - Renders without layout
- **All other routes** - Automatically wrapped with `AuthenticatedLayout`

```typescript
function RootComponent() {
  const location = useLocation()
  
  if (location.pathname === "/login") {
    return <Outlet /> // No layout for login
  }
  
  return <AuthenticatedLayout /> // Automatic layout for all other routes
}
```

### Component Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives (shadcn/ui)
│   ├── layout/          # Layout components
│   └── router/          # Router-specific components
├── lib/                 # Utilities and services
│   ├── api.ts          # HTTP API methods
│   ├── queries.ts      # TanStack Query configurations
│   ├── http-client.ts  # HTTP client setup
│   └── auth-storage.ts # Authentication storage utilities
├── routes/             # File-based routes
└── types.ts           # Shared TypeScript interfaces
```

## Data Loading with TanStack Query

### Route-Level Data Preloading

Routes use loaders to prefetch data before rendering:

```typescript
export const Route = createFileRoute("/spaces")({
  loader: ({ context: { queryClient } }) => 
    queryClient.ensureQueryData(spacesQueryOptions()),
  component: SpacesPage,
})

function SpacesPage() {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())
  // Data is guaranteed to be available - no loading states needed
}
```

### Query Configuration Patterns

All queries are centralized in `lib/queries.ts`:

```typescript
export const spacesQueryOptions = () =>
  queryOptions({
    queryKey: ["spaces"],
    queryFn: () => api.getSpaces(),
    staleTime: 1000 * 60 * 5, // Strategic caching based on data volatility
  })
```

### API Layer Separation

Clean separation of concerns:

- **`lib/api.ts`** - Pure HTTP requests only
- **`lib/http-client.ts`** - HTTP client configuration
- **`lib/auth-storage.ts`** - Authentication storage utilities
- **`auth.tsx`** - Authentication logic and state management

## Router Configuration

### Default Components

The router provides consistent UX with global defaults:

```typescript
export const router = createRouter({
  routeTree,
  defaultPendingComponent: PendingComponent,
  defaultErrorComponent: ErrorComponent, 
  defaultNotFoundComponent: NotFoundComponent,
  defaultPendingMs: 100,
  defaultPendingMinMs: 500,
})
```

### File-Based Routing

Routes are automatically generated from the `src/routes/` directory:

- `__root.tsx` - Root layout with authentication guard
- `login.tsx` - Public authentication page
- `spaces.tsx` - Protected spaces listing
- `index.tsx` - Redirects to `/spaces`

## Import Conventions

**Mandatory path aliases for cross-directory imports:**

```typescript
// ✅ Required - Use path aliases
import { Button } from "@/components/ui/button"
import { useAuth } from "@/auth"
import type { Space } from "@/types"

// ✅ Allowed - Relative for same directory
import { LocalComponent } from "./LocalComponent"

// ❌ Forbidden - Deep relative paths
import { Button } from "../../../components/ui/button"
```

## Security Benefits

- **Fail-safe**: Impossible to forget authentication on new routes
- **Type safety**: `useAuthUser()` eliminates null checks in protected routes
- **Automatic token management**: HTTP client handles session injection/validation
- **Event-driven logout**: Cross-component coordination for security events
- **Clean separation**: Authentication logic isolated from business logic

## Development Experience

- **Route loaders** eliminate loading states in components  
- **Suspense integration** provides smooth data loading
- **Type-safe routing** with auto-generated route types
- **Consistent error handling** via router defaults
- **Clean API architecture** with separation of concerns

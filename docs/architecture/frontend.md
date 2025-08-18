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

## Routing

Browser-based routing with authentication checks:

```typescript
/ (root)
├── /login              # Public route with built-in auth check
└── / (protected)       # Private routes wrapped in AuthLayout
    ├── /                # Home page
    ├── /spaces          # Spaces list
    ├── /spaces/new      # Create new space
    └── /change-password # Change password (TODO)
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

### API Structure
**Design Decision**: We use a consciously flat API structure with a single `api` object containing all methods. This provides:
- Single entry point to backend API (`lib/api.ts`)
- Simple, flat method access without nested namespaces
- Clear and direct method naming
- Easy to understand and use

```typescript
// Single api object with flat methods
api.login()
api.logout()
api.getCurrentUser()
api.getSpaces()
api.createSpace()
```

All API methods are defined in one file for simplicity and maintainability.

## Component System

### UI Components (shadcn/ui)
Pre-styled, accessible components:
- Form controls (Input, Button, Textarea)
- Layout (Card, Dialog, Table)
- Feedback (Badge, Skeleton, Sonner toasts)
- Built with Radix UI primitives
- Styled with Tailwind CSS

### Page Components
Route-specific components in `pages/` with `*Page` naming convention:
- `LoginPage` - Authentication form with built-in auth check
- `HomePage` - Dashboard/landing page
- `SpacesPage` - List of all spaces
- `SpaceNewPage` - Create new space form

**Naming Convention**: All page components must use the `Page` suffix (e.g., `LoginPage.tsx`, `HomePage.tsx`) to distinguish them from future sub-components or modules that may be added to the `/pages/` folder.

### Layout Components
- `AuthLayout` - Main layout for authenticated pages with header, navigation, and footer
- Toaster component configured globally in `App.tsx`

### Component Patterns
- Controlled forms with react-hook-form
- Zod schema validation
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

React Hook Form with Zod validation:
- Type-safe form schemas
- Automatic error messages
- Field-level validation
- Form state management

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
# SpaceNote Frontend Architecture

**Status**: Active development
**Location**: `/frontend`
**Port**: `SPACENOTE_FRONTEND_PORT` (default: 3002)

SpaceNote's modern frontend implementation built with React and TypeScript. This provides a clean, responsive user interface for managing spaces and notes.

**Goals:**
- Modern React architecture
- Type-safe development with TypeScript
- Optimized bundle size and performance
- Clean state management patterns
- Responsive, accessible UI components

### Technology Stack

**Core Framework:**
- TypeScript 5.8+ for type safety
- React 19 for UI components
- Vite 7 for build tooling and development server

**State Management:**
- Zustand 5.0 for application state management

**HTTP & API:**
- Ky 1.x for HTTP requests with built-in retry logic

**Forms & Validation:**
- React Hook Form 7 for performant form handling
- Zod 4 for schema validation and TypeScript integration

**UI Components:**
- Tailwind CSS 4 for utility-first styling
- shadcn/ui components built on Radix UI primitives

**Rich Text:**
- TipTap 3 for markdown editing with WYSIWYG interface


## Development Strategy

SpaceNote uses a modern single-page application (SPA) architecture built with React. The backend provides a comprehensive REST API that serves the frontend application.

## API Design

SpaceNote uses an **HTTP API approach** rather than strict REST for better simplicity and developer experience.

### API Design Philosophy

- **HTTP API over REST**: Prioritizes simplicity and short URLs over strict REST compliance
- **Query parameters for context**: Uses `space_id`, `filter_id`, `note_id` parameters with `_id` suffix for consistency
- **Entity-based routing**: Each major entity (`notes`, `spaces`, `attachments`) has its own router
- **Mandatory context**: All operations require appropriate context (e.g., `space_id` for notes)

### Endpoint Structure
```
# Spaces management
GET    /api/spaces                      # List user's spaces
GET    /api/spaces/{space_id}           # Get space details (includes filters)

# Notes operations
GET    /api/notes?space_id={id}         # List notes in space
GET    /api/notes?space_id={id}&filter_id={filter}&page=1
POST   /api/notes?space_id={id}         # Create note
GET    /api/notes/{note_id}?space_id={id}  # Get note details
PUT    /api/notes/{note_id}?space_id={id}  # Update note
DELETE /api/notes/{note_id}?space_id={id}  # Delete note

# Comments operations (future)
GET    /api/comments?space_id={id}&note_id={note}  # List comments
POST   /api/comments?space_id={id}&note_id={note}  # Create comment

# Attachments operations (future)  
GET    /api/attachments?space_id={id}   # List space attachments
GET    /api/attachments?space_id={id}&note_id={note}  # Note attachments
```

**Benefits of this approach:**
- **Shorter URLs**: `/api/notes?space_id=my-tasks` vs `/api/spaces/my-tasks/notes`
- **Clear separation**: Each entity has its own router file
- **Flexible parameters**: Easy to add filtering, pagination, sorting
- **Consistent naming**: All ID parameters use `_id` suffix

### Authentication
Session-based authentication with header:
```
X-Session-ID: <session-id>
```

### Response Format
```typescript
interface ApiResponse<T> {
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}
```

## Service Layer Architecture

SpaceNote uses a **three-layer architecture** that cleanly separates concerns between data fetching, business logic, and state management. This approach ensures maintainability, testability, and a clear flow of data through the application.

### Architecture Overview

```
┌─────────────┐
│  Component  │  ← UI logic only, calls services
└──────┬──────┘
       │
┌──────▼──────┐
│   Service   │  ← Business logic, side effects, orchestration
└──────┬──────┘
       │
┌──────▼──────┐
│     API     │  ← Pure HTTP communication
└──────┬──────┘
       │
┌──────▼──────┐
│    Store    │  ← Pure state management
└─────────────┘
```

### Layer Responsibilities

#### 1. API Layer (`lib/api/`)
The API layer is responsible for **pure HTTP communication** with zero side effects.

**Principles:**
- Only handles HTTP requests and responses
- No UI concerns (no toasts, alerts, or notifications)
- No state management (no store updates)
- No navigation or routing
- Platform-agnostic (works in browser, Node.js, React Native)
- Throws errors for the service layer to handle

**Example:**
```typescript
// lib/api/spaces.ts
export const spacesApi = {
  listSpaces: async (): Promise<Space[]> => {
    return await api.get("spaces").json()
  },
  
  createSpace: async (data: CreateSpaceRequest): Promise<Space> => {
    return await api.post("spaces", { json: data }).json()
  }
}
```

#### 2. Service Layer (`services/`)
The service layer **orchestrates business logic** and handles all side effects.

**Responsibilities:**
- Calls API functions
- Updates stores with results
- Shows toast notifications
- Handles navigation
- Centralizes error handling
- Manages complex workflows

**Example:**
```typescript
// services/spaceService.ts
export async function createSpace(data: CreateSpaceRequest): Promise<void> {
  try {
    const space = await spacesApi.createSpace(data)
    useSpacesStore.getState().spaces.push(space)
    toast.success("Space created successfully")
    window.location.href = `/spaces/${space.id}`
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to create space")
    // Don't throw - error is handled with toast
  }
}
```

#### 3. Store Layer (`stores/`)
Stores are **pure state containers** with minimal logic.

**Principles:**
- No async operations or API calls
- No side effects
- Direct state mutations are allowed (when called from services)
- Minimal methods (mainly getters)
- Persisted state when needed

**Example:**
```typescript
// stores/spacesStore.ts
export const useSpacesStore = create<SpacesState>()(
  persist(
    (set, get) => ({
      spaces: [],
      isLoading: false,
      error: null,
      
      getSpace: (spaceId: string) => {
        return get().spaces.find(space => space.id === spaceId)
      },
    }),
    {
      name: "spacenote-spaces",
      partialize: state => ({ spaces: state.spaces }),
    }
  )
)
```

### Component Integration

Components become extremely simple by calling service functions directly:

```typescript
// pages/LoginPage.tsx
export default function LoginPage() {
  const form = useForm({ ... })
  
  const handleSubmit = async (data: FormData) => {
    await login(data.username, data.password)
    // That's it! Service handles everything else
  }
}

// dialogs/CreateSpaceDialog.tsx
const handleSubmit = async (data: FormData) => {
  await createSpace(data)
  onClose()
}
```

**Benefits:**
- No try-catch blocks needed (errors handled in services)
- No manual navigation code
- No direct store updates
- Focus purely on UI logic

### Error Handling Pattern

Services use a helper function to reduce boilerplate:

```typescript
async function executeWithToast<T>(
  operation: () => Promise<T>,
  successMessage: string,
  errorMessage: string
): Promise<T> {
  try {
    const result = await operation()
    toast.success(successMessage)
    return result
  } catch (error) {
    if (isHttpError(error) && error.response.status === 401) {
      handleUnauthorized()
      throw error
    }
    toast.error(error instanceof Error ? error.message : errorMessage)
    throw error
  }
}
```

### Benefits of This Architecture

1. **Testability**
   - API layer can be tested with simple HTTP mocks
   - Services can be tested with mocked APIs and stores
   - Stores are pure and easy to test
   - Components need minimal testing (just UI behavior)

2. **Reusability**
   - API layer works in any JavaScript environment
   - Services can be called from anywhere
   - No coupling between layers

3. **Maintainability**
   - Clear separation of concerns
   - Easy to understand data flow
   - Consistent patterns across the codebase
   - Single place to change business logic

4. **Developer Experience**
   - Components are simple and focused
   - No boilerplate in components
   - Errors handled consistently
   - Easy to add new features

### Adding New Features

When adding a new feature, follow this pattern:

1. **Add API functions** in `lib/api/` - pure HTTP calls
2. **Create service functions** in `services/` - business logic
3. **Update store if needed** in `stores/` - only state, no logic
4. **Call service from component** - one line of code

This architecture ensures that each layer has a single, clear responsibility, making the codebase easy to understand and maintain.

## File Organization Architecture

### Component Classification Strategy

SpaceNote follows a clear component classification system that eliminates confusion about where components should be placed and ensures maintainable code organization.

#### Classification Rules

**Global Components** (`src/components/`):
- Components used by multiple pages or throughout the application
- Business logic agnostic, reusable across domains
- Examples: Layout components, UI primitives, shared utilities

**Page-Specific Components** (`src/pages/{domain}/components/`):
- Components used exclusively by one page
- Contains domain-specific business logic and state
- Co-located with their parent pages for clear ownership

**Global Dialogs** (`src/dialogs/`):
- Modal dialogs that can be triggered from multiple pages
- Examples: User management, system-wide settings

#### Decision Matrix

Use this simple decision tree when creating or organizing components:

1. **Is it a modal dialog?** → `src/dialogs/`
2. **Used by 2+ pages?** → `src/components/`
3. **Used by 1 page only?** → `src/pages/{domain}/components/`

### Directory Structure

```
src/
├── components/                 # GLOBAL COMPONENTS ONLY
│   ├── layout/                 # Navigation, headers, footers
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Layout.tsx
│   │   └── header/             # Header sub-components
│   │       ├── SpaceSelector.tsx
│   │       └── UserMenu.tsx
│   └── ui/                     # UI primitives (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
├── pages/                      # PAGES + PAGE-SPECIFIC COMPONENTS
│   ├── spaces/
│   │   ├── index.tsx           # Spaces listing page
│   │   ├── SpaceFields.tsx     # Space fields management page
│   │   └── components/         # SPACE-SPECIFIC COMPONENTS
│   │       ├── FieldsTable.tsx
│   │       ├── ListFieldsConfig.tsx
│   │       ├── HiddenFieldsConfig.tsx
│   │       └── AddFieldDialog.tsx (future)
│   ├── notes/
│   │   ├── SpaceNotes.tsx      # Notes listing page
│   │   ├── NoteDetail.tsx      # Note detail page
│   │   └── components/         # NOTES-SPECIFIC COMPONENTS
│   │       ├── NotesTable.tsx
│   │       ├── FilterDropdown.tsx
│   │       ├── NoteForm.tsx (future)
│   │       └── NoteFieldDisplay.tsx (future)
│   ├── IndexPage.tsx
│   └── login.tsx
├── dialogs/                    # GLOBAL MODAL DIALOGS
│   ├── CreateSpaceDialog.tsx
│   ├── UserManagementDialog.tsx
│   └── ChangePasswordDialog.tsx
├── lib/                        # UTILITIES & SERVICES
│   ├── api/                    # API clients
│   ├── auth.ts                 # Authentication utilities
│   ├── dialog/                 # Dialog management system
│   ├── formatters.ts           # Data formatting utilities
│   └── utils.ts                # General utilities
├── stores/                     # GLOBAL STATE MANAGEMENT
│   ├── authStore.ts
│   └── spacesStore.ts
└── ...
```

### Benefits of This Architecture

**Clear Ownership:**
- Each component has an obvious owner and purpose
- Easy to locate components when making changes
- Reduces "where should this go?" decisions

**Reduced Coupling:**
- Page-specific changes don't affect other pages
- Components are scoped to their actual usage
- Easier to refactor individual pages

**Better Maintainability:**
- Smaller, focused components with single responsibilities
- Clear separation between global and domain-specific logic
- Self-documenting structure

**Scalability:**
- Easy to add new domains without polluting global namespace
- Each page can evolve independently
- Natural extension points for new features

### Component Guidelines

**For Page-Specific Components:**
- Keep business logic specific to the domain
- Use descriptive, domain-specific names
- Import page-specific components using relative paths
- Feel free to create sub-directories for complex pages

**For Global Components:**
- Ensure true reusability across multiple contexts
- Keep business logic minimal and generic
- Use clear, generic naming
- Document props and usage patterns

**For Dialogs:**
- Implement using the dialog management system
- Consider if the dialog is truly global or page-specific
- Page-specific dialogs can go in page components directory

### Migration Strategy

When refactoring existing components:

1. **Identify usage patterns**: Count how many pages use the component
2. **Apply decision matrix**: Use the classification rules above
3. **Move and update imports**: Update all import statements
4. **Test functionality**: Ensure all components still work correctly

This architecture scales naturally as the application grows while maintaining clear organizational principles.

## Import Path Guidelines

### Path Alias Configuration

SpaceNote uses path aliases for clean, maintainable imports:

```typescript
// tsconfig.json & vite.config.ts
"@/*": ["./src/*"]  // Points to src directory
```

### Import Rules

**✅ Use Path Aliases For:**
- Cross-directory imports: `@/components/ui/button`
- All imports from core directories: `@/lib/*`, `@/stores/*`, `@/components/*`
- Any import traversing more than one directory level
- Type imports: `@/lib/api/notes`

```typescript
// ✅ CORRECT - Use aliases
import { Button } from "@/components/ui/button"
import { useSpacesStore } from "@/stores/spacesStore"
import type { Note } from "@/lib/api/notes"
import { formatFieldValue } from "@/lib/formatters"
```

**✅ Use Relative Paths For:**
- Same directory imports: `./ComponentName`
- Page-specific component imports within the same page directory
- Single level parent imports (rare cases only)

```typescript
// ✅ CORRECT - Relative for same directory
import { FieldsTable } from "./components/FieldsTable"
import { ListFieldsConfig } from "./components/ListFieldsConfig"
```

**❌ Never Use:**
- Deep relative paths: `../../../lib/formatters`
- Mixed styles in the same file
- Relative paths for shared utilities

```typescript
// ❌ INCORRECT - Avoid deep relative paths
import { Button } from "../../../components/ui/button"
import { formatters } from "../../../../lib/formatters"
```

### Benefits of Path Aliases

**Readability:**
- `@/components/ui/button` vs `../../../components/ui/button`
- Clear, consistent import style across all files

**Maintainability:**
- Moving files doesn't break imports
- Easy refactoring without path updates

**IDE Support:**
- Better autocomplete and IntelliSense
- Accurate go-to-definition navigation
- Easier project-wide search and replace

**Industry Standard:**
- Used by Next.js, Nuxt, Vue CLI, Create React App
- Consistent with modern TypeScript/React projects
- Expected by developers joining the project

### Implementation Examples

**Global Components:**
```typescript
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
```

**Page Components:**
```typescript
import { FieldsTable } from "./components/FieldsTable"  // Same page
import { useSpacesStore } from "@/stores/spacesStore"   // Global store
```

**Utilities and APIs:**
```typescript
import { spacesApi } from "@/lib/api/spaces"
import { formatDateTime } from "@/lib/formatters"
import type { Space, SpaceField } from "@/lib/api/spaces"
```

Following these guidelines ensures consistent, maintainable imports throughout the SpaceNote frontend.

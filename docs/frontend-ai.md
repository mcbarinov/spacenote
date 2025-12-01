# Frontend AI Guidelines

Rules for AI agents working on the frontend codebase.

## 1. Comments & Documentation

### 1.1 General Principles

1. **Comment all functions and classes** — Even short one-line comments. Creates consistency and prevents missing documentation.

2. **WHY > WHAT** — "Why" comments explaining business logic are mandatory for non-obvious decisions. "What" comments only for complex logic where code isn't self-explanatory.

3. **Keep comments short** — One line preferred. Multi-line only when necessary.

### 1.2 Functions & Utilities

**All functions get JSDoc:**
```typescript
/** Formats date to locale string */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString()
}

/** Type-safe string coercion for form values */
function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}
```

**Document non-obvious parameters with @param:**
```typescript
/**
 * Uploads file as pending attachment.
 * @param file - File to upload (will be processed async)
 */
export function uploadAttachment(file: File): Promise<PendingAttachment>
```

### 1.3 React Components

**JSDoc above component:**
```typescript
/** File upload input with preview, loading, and error states */
export function ImageFieldInput({ ... }: ImageFieldInputProps)
```

**Props in interface (only non-obvious):**
```typescript
interface ImageFieldInputProps {
  label: string
  required?: boolean
  /** Pending attachment number or null if empty */
  value: number | null
  /** Called with pending attachment number after upload */
  onChange: (value: number | null) => void
}
```

### 1.4 API Layer

**All hooks get JSDoc:**
```typescript
/** Fetches current authenticated user */
export function currentUser() {
  return queryOptions({ ... })
}

/** Hook to get current user from cache */
export function useCurrentUser(): User {
  return useSuspenseQuery(currentUser()).data
}
```

**Complex side effects — explain in comment:**
```typescript
export function useLogout() {
  return useMutation({
    mutationFn: () => httpClient.post("api/v1/auth/logout"),
    onSuccess: () => {
      // We don't clear queryClient cache because:
      // 1. Navigation to /login happens immediately
      // 2. Fresh data loads on next login via _auth.beforeLoad
      // 3. Clearing here causes race condition with Header re-render
    },
  })
}
```

Simple invalidation — no comment needed:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["users"] })
}
```

### 1.5 Routes

**Complex loaders/beforeLoad — explain logic:**
```typescript
export const Route = createFileRoute("/_auth")({
  // Validates auth and redirects to login if unauthorized
  beforeLoad: async ({ context, location }) => {
    try {
      const currentUser = await context.queryClient.ensureQueryData(
        api.queries.currentUser()
      )
      return { currentUser }
    } catch (error) {
      // Handle 401 by redirecting to login with return URL
      const appError = AppError.fromUnknown(error)
      if (appError.code === "unauthorized") {
        throw redirect({ to: "/login", search: { redirect: location.href } })
      }
      throw error
    }
  },
})
```

**Simple data loading — no comment needed:**
```typescript
loader: async ({ context, params }) => {
  await context.queryClient.ensureQueryData(
    api.queries.getNote(params.slug, Number(params.noteNumber))
  )
}
```

### 1.6 Block Comments

**Group related operations in long code:**
```typescript
function processNote(note: Note) {
  // --- Validate fields ---
  validateRequiredFields(note)
  validateFieldTypes(note)

  // --- Transform data ---
  const normalized = normalizeFields(note)
  const enriched = addComputedFields(normalized)

  // --- Save ---
  return saveNote(enriched)
}
```

### 1.7 WHY Comments

**Always explain non-obvious decisions:**
```typescript
// Only optional fields or fields with defaults can be hidden on create form
const hiddenFieldOptions = space.fields
  .filter((f) => !f.required || f.default !== null)
  .map((f) => f.name)

// Using POST instead of DELETE because proxy doesn't forward DELETE body
await httpClient.post("api/v1/bulk-delete", { json: { ids } })

// Delay to allow animation to complete before unmounting
await new Promise((r) => setTimeout(r, 300))
```

### Summary

| Area | Rule |
|------|------|
| Functions | Comment ALL, even trivial |
| Props | In interface, only non-obvious |
| Route loaders | Only complex ones |
| API side effects | Only complex ones |
| WHY comments | Always for non-obvious logic |
| WHAT comments | Only for complex logic |
| Block headers | For grouping in long code |

## 2. Code Simplification

### 2.1 Review Parent Structure After Removal

When removing elements from JSX, check if remaining wrappers or containers are still necessary. A component that grouped multiple children may become redundant with only one child.

```tsx
// Before: Group justified two buttons
<Group justify="flex-end">
  <Button variant="subtle">Cancel</Button>
  <Button type="submit">Save</Button>
</Group>

// Bad - Group with single child is redundant
<Group justify="flex-end">
  <Button type="submit">Save</Button>
</Group>

// Good - removed unnecessary wrapper
<Button type="submit">Save</Button>
```

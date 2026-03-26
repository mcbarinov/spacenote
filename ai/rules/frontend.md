# Frontend AI Guidelines

Rules for AI agents working on the frontend codebase.

## 1. Comments & Documentation

### 1.1 Non-Obvious Parameters

```typescript
/**
 * Uploads file as pending attachment.
 * @param file - File to upload (will be processed async)
 */
export function uploadAttachment(file: File): Promise<PendingAttachment>
```

Inner functions inside components (handlers like `handleSave`, `handleChange`, `handleSubmit`) don't need JSDoc if the name is self-explanatory.

### 1.2 React Components

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

### 1.3 API Layer

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

### 1.4 Routes

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

## 3. Form Buttons

Submit buttons in Stack forms — right-align with Group:

```tsx
<Stack gap="sm">
  <TextInput {...form.getInputProps("name")} />
  <Group justify="flex-end">
    <Button type="submit" loading={mutation.isPending}>
      Save
    </Button>
  </Group>
</Stack>
```

## 4. File Organization

### 4.1 Component Placement

| Where | When |
|-------|------|
| `src/components/` | Used across **unrelated** parts of the app |
| `-shared/` | Used only within **one route branch** (e.g., all of `/spaces/*`) |
| `-local/` | Used by **one** page or layout |

If a component is only used within one route branch, put it in that branch's `-shared/`, not in `components/`. `components/` is the global scope.

### 4.2 Route File Structure

Default to flat files for routes. Only promote to a directory when the page needs `-local/` or `-shared/` sub-components.

```
# ✅ Standalone page — flat file
admin/temp-space-access.page.tsx

# ✅ Page with local components — directory
admin/users/index/page.tsx
admin/users/index/-local/SetPasswordButton.tsx

# ❌ Wrong — directory without -local/-shared
admin/spaces/index/page.tsx    # should be admin/spaces.page.tsx
```

### 4.3 Keep Related Code Together

Don't split into separate files unnecessarily. Keep component and its helper functions in one file if helpers are only used by that component.

### 4.4 Directory Modules

When a component has private sub-components too large to inline, convert to a directory:

```
ComponentName/
  index.tsx             ← public, the main component
  SubComponent.tsx      ← private, only used by index.tsx
```

External imports stay unchanged (`@/components/ComponentName` resolves via `index.tsx`). Applies to `components/`, `-local/`, and `-shared/` equally.

# Frontend AI Guidelines

Rules for AI agents working on the frontend codebase.

## Comments

- **Explain non-obvious logic** — Add comments when code purpose isn't clear:
  - **"Why"** — explain business logic behind filtering, conditions, etc.
  - **"What"** — add header comments for complex blocks or groups of related operations

```typescript
// Bad - unclear why we filter this way
const fieldOptions = space.fields
  .filter((f) => !f.required || f.default !== null)
  .map((f) => f.name)

// Good - explains the reason
// Only optional fields or fields with defaults can be hidden
const fieldOptions = space.fields
  .filter((f) => !f.required || f.default !== null)
  .map((f) => f.name)
```

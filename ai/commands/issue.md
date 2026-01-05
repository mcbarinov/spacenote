# /issue

Create or refine GitHub issues with detailed implementation plans.

## Usage

```
/issue              # Create new issue
/issue #123         # Refine existing issue
/issue 123          # Same as above (# is optional)
```

## Description

Universal command for GitHub issue management. Reads ALL project documentation to create comprehensive plans for each agent type (backend, frontend, deploy).

## Actions

### Without argument (create new issue)

1. Ask user for idea/problem description
2. Read project documentation:
   - `docs/concepts.md` - domain model
   - `docs/backend.md` - backend architecture
   - `docs/frontend.md` - frontend architecture
   - `ai/rules/backend.md` - backend coding rules
   - `ai/rules/frontend.md` - frontend coding rules
   - `docs/ideas.md` - planned features (avoid duplicates)
   - `ai/rules/github-issues.md` - issue format
3. Determine scope (backend/frontend/deploy)
4. Analyze relevant code if needed
5. Create issue via `gh issue create` with structure below
6. Add labels: scope (`backend`/`frontend`/`deploy`) + `draft`
7. Return issue number and URL

### With argument (refine existing issue)

1. Read issue via `gh issue view {number}`
2. Read all project documentation (same as above)
3. Analyze codebase for relevant context
4. Update issue body via `gh issue edit {number} --body "..."`
5. Update labels: remove `draft`, add `ready`
6. Return updated issue URL

## Issue Structure

```markdown
## Summary
One paragraph: what problem we're solving and why.

## Scope
- [x] backend
- [x] frontend
- [ ] deploy

## Context
Related: #100, #101
Files: apps/backend/src/.../module/

## Plan: Backend
1. Step 1 (file: apps/backend/.../file.py)
2. Step 2
3. Step 3

## Plan: Frontend
1. Step 1 (file: apps/web/.../Component.tsx)
2. Step 2

## Plan: Deploy
<!-- If deploy scope is checked -->

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## Labels

| Label | When to use |
|-------|-------------|
| `backend` | Issue involves backend work |
| `frontend` | Issue involves frontend work |
| `deploy` | Issue involves deploy work |
| `draft` | Initial creation, needs refinement |
| `ready` | Plan is complete, ready to implement |

For multi-scope: apply multiple labels (`backend` + `frontend`).

## Notes

- Plans should be specific: include file paths, function names
- Each plan step should be actionable
- Acceptance criteria should be testable
- If issue already has good plans, just review and improve
- Don't duplicate features from `docs/ideas.md`

## Example

```
> /issue
User: "Add user avatars to profile page"

[Reads docs, analyzes code...]

Created issue #123: "Add user avatars"
https://github.com/user/repo/issues/123

Labels: backend, frontend, draft

> /issue #123

[Reads issue, analyzes code more deeply...]

Updated issue #123 with detailed plans.
Labels updated: ready (removed draft)

Ready for external AI review or implementation.
```

ultrathink

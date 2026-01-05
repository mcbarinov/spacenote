# GitHub Issues Rules

Rules for AI agents working with GitHub issues.

## Overview

**AI-assisted development workflow using GitHub Issues.**

GitHub Issues as the central place for all tasks:
- Issues created via `/issue` command with detailed plans for each agent
- Each issue contains `Plan: Backend`, `Plan: Frontend`, `Plan: Deploy` sections
- Each agent reads only its plan section

**Parallel work:**
- Different worktrees = different issues
- Work on multiple issues simultaneously in different worktrees

**Sequential work within one issue:**
- One issue = one worktree = one branch = one PR
- Backend first (`/start-backend`), then frontend (`/start-frontend`)

**Issue lifecycle:**
```
/issue          → Create draft
/issue #123     → Refine plans
[AI review]     → External AI reviews the plan
git checkout -b → Create branch
/start-*        → Load agent context
"Work on #123"  → Agent reads its plan
/review-pr      → PR → Merge
```

## Issue Structure

Every issue follows this structure:

```markdown
## Summary
One paragraph: what and why.

## Scope
- [x] backend
- [x] frontend
- [ ] deploy

## Context
Related: #100, #101
Files: apps/backend/src/.../

## Plan: Backend
1. Step (file: path/to/file.py)
2. Step

## Plan: Frontend
1. Step (file: path/to/file.tsx)
2. Step

## Plan: Deploy
<!-- Only if deploy scope checked -->

## Acceptance Criteria
- [ ] Testable criterion
```

## Agent Plan Sections

Each agent reads only its plan section:

| Agent | Command | Reads Section |
|-------|---------|---------------|
| Backend | `/start-backend` | `## Plan: Backend` |
| Frontend | `/start-frontend` | `## Plan: Frontend` |
| Deploy | `/start-deploy` | `## Plan: Deploy` |

When told "work on #123", read the issue and find your plan section.

## Labels

| Label | Meaning |
|-------|---------|
| `backend` | Backend work |
| `frontend` | Frontend work |
| `deploy` | Deploy work |
| `draft` | Needs refinement |
| `ready` | Ready to implement |

For multi-scope: apply multiple labels (`backend` + `frontend`).

## Branch Naming

Format: `{label}/{short-name}`

Examples:
- `feat/user-avatars`
- `fix/login-redirect`
- `refactor/note-service`

Labels from `ai/rules/project.md`: `feat:`, `fix:`, `chore:`, `infra:`, `refactor:`

## Plan Quality

Good plans are:
- **Specific**: include file paths, function names
- **Ordered**: dependencies first
- **Actionable**: each step is doable
- **Complete**: cover all acceptance criteria

Example:
```markdown
## Plan: Backend
1. Add `avatar` field to User model (apps/backend/src/spacenote/core/modules/user/models.py)
2. Add `upload_avatar` endpoint to router (apps/backend/src/spacenote/core/modules/user/router.py)
3. Create image processing util (apps/backend/src/spacenote/core/utils/image.py)
4. Add tests for avatar upload (apps/backend/tests/test_user.py)
```

## GitHub CLI Commands

```bash
# Create issue
gh issue create --title "Title" --body "Body" --label "backend,draft"

# View issue
gh issue view 123

# Edit issue body
gh issue edit 123 --body "New body"

# Update labels
gh issue edit 123 --remove-label "draft" --add-label "ready"

# Link PR to issue (in PR description)
Closes #123
```

# GitHub Issues Rules

Rules for AI agents working with GitHub issues.

## Issue Format

Issue = brief task description. No structure, no headers.

```markdown
Add user avatars to profile.

Currently the profile looks empty. Avatars will make it personal
and help recognize people in comments.
```

Contains:
- What we want to do
- Why / context

Does NOT contain:
- Detailed implementation plans
- File lists
- Acceptance criteria (unless non-obvious)

## Workflow

```
/issue                      → Create brief issue
/start-backend              → Load context (documentation)
"work on issue #123"        → Agent reads issue, builds plan, shows it
"ok, do it"                 → Implements
/issue-comment              → Log decision as comment
/review-pr                  → Reviewer sees issue + comments
```

## Working with Issues

When user says "work on issue #123" or "look at #123":

1. Read issue via `gh issue view 123`
2. Analyze what needs to be done
3. Build implementation plan
4. Show plan to user
5. After approval — implement

Agent determines implementation details based on:
- Issue description
- Current code state
- Project documentation

## Comments for Logging

Important decisions are logged as issue comments:

- Why requirements changed
- What was tried and why it didn't work
- Architectural decisions

Use `/issue-comment` to add comments.

## Labels

**Scope:**
- `backend` — Backend work
- `frontend` — Frontend work
- `deploy` — Deploy work

**Type:**
- `feat` — New feature
- `chore` — Maintenance
- `refactor` — Refactoring

## Branch Naming

Format: `{type}/{short-name}`

Examples:
- `feat/user-avatars`
- `fix/login-redirect`
- `refactor/note-service`

## GitHub CLI Commands

```bash
# Create issue
gh issue create --title "Title" --body "Body" --label "backend,feat"

# View issue
gh issue view 123

# Add comment
gh issue comment 123 --body "Comment text"

# Link PR to issue (in PR description)
Closes #123
```

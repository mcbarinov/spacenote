# /issue

Create a GitHub issue with a brief description.

## Usage

```
/issue
```

## Description

Creates a new GitHub issue. Issues are brief — just describe what you want and why.

## Actions

1. Ask user for idea/problem description
2. Read `docs/ideas.md` to avoid duplicates
3. Determine labels (scope + type)
4. Create issue via `gh issue create`
5. Return issue number and URL

## Issue Format

No structure, no headers. Just text:

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

## Labels

**Scope:** `backend`, `frontend`, `deploy`

**Type:** `feat`, `chore`, `refactor`

## Example

```
> /issue
User: "Add user avatars to profile page"

Created issue #123: "Add user avatars"
https://github.com/user/repo/issues/123

Labels: backend, frontend, feat
```

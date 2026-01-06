# /issue

Create or refine a GitHub issue.

## Usage

```
/issue           # Create new issue
/issue #123      # Refine existing issue
```

## Description

**Create mode**: Creates a new GitHub issue based on user's idea.

**Refine mode**: Reads existing issue with all comments, proposes updated body that incorporates insights from comments.

## Actions (Create)

1. Ask user for idea/problem description
2. Read `docs/ideas.md` to avoid duplicates
3. Determine labels (scope + type)
4. Create issue via `gh issue create`
5. Return issue number and URL

## Actions (Refine)

1. Read issue with comments: `gh issue view 123 --comments`
2. Analyze current body and all comments
3. Propose new body that:
   - Keeps original intent
   - Incorporates decisions/learnings from comments
   - Adds considerations if discovered
4. Show proposed body to user for approval
5. Update via `gh issue edit 123 --body "..."`

## Issue Format

Can be brief or detailed, depending on complexity.

**Brief** (quick idea):
```markdown
Add user avatars to profile.

Currently the profile looks empty. Avatars will make it personal.
```

**Detailed** (thought through):
```markdown
Add user avatars to profile.

Currently the profile looks empty. Avatars will make it personal
and help recognize people in comments.

Considerations:
- Store in S3 or MongoDB?
- Crop on upload or fixed aspect ratio?
- Default avatar: initials or generic icon?
```

**Contains:**
- What we want to do
- Why / context
- Key considerations, open questions (optional)

**Does NOT contain:**
- Step-by-step implementation plans (AI builds its own)
- File lists
- Acceptance criteria checklists

## Labels

**Scope:** `backend`, `frontend`, `deploy`

**Type:** `feat`, `chore`, `refactor`

## Examples

**Create:**
```
> /issue
User: "Add user avatars to profile page"

Created issue #123: "Add user avatars"
https://github.com/user/repo/issues/123
Labels: backend, frontend, feat
```

**Refine:**
```
> /issue #123

Reading issue #123 with comments...

Current body:
  Add user avatars to profile.

Comments summary:
  - Decided: store in S3, not MongoDB
  - Decided: use generic icon as default

Proposed new body:

  Add user avatars to profile.

  Currently the profile looks empty. Avatars will make it personal.

  Decisions:
  - Store in S3 (files too large for MongoDB)
  - Default avatar: generic icon

Update issue? [y/n]
```

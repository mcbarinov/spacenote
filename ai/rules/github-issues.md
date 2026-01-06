# GitHub Issues Rules

Rules for AI agents working with GitHub issues.

## Issue Format

Issue = task description. Can be brief or detailed, depending on complexity.

**Brief** (quick idea, refine later):
```markdown
Add user avatars to profile.

Currently the profile looks empty. Avatars will make it personal.
```

**Detailed** (when you've thought it through):
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

## Workflow

```
/issue                      → Create new issue
/issue #123                 → Refine existing issue (read comments, rewrite body)
/start-backend              → Load context (documentation)
"work on issue #123"        → Agent reads issue + comments, builds plan
"ok, do it"                 → Implements
/issue-comment              → Log decision as comment
/review-pr                  → Reviewer sees issue + comments
```

## Working with Issues

When user says "work on issue #123" or "look at #123":

1. Read issue with comments: `gh issue view 123 --comments`
2. Analyze issue body AND all comments
3. Build implementation plan
4. Show plan to user
5. After approval — implement

Agent determines implementation details based on:
- Issue description
- All issue comments (decisions, learnings, clarifications)
- Current code state
- Project documentation

## Comments

Issue comments capture decisions and learnings during development:

- Why requirements changed
- What was tried and why it didn't work
- Architectural decisions

Use `/issue-comment` to add comments. These comments will be read and considered when:
- Working on the issue (`work on #123`)
- Refining the issue (`/issue #123`)

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

# View issue with comments
gh issue view 123 --comments

# Edit issue body
gh issue edit 123 --body "New body"

# Add comment
gh issue comment 123 --body "Comment text"

# Link PR to issue (in PR description)
Closes #123
```

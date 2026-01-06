# /issue

Create or refine GitHub issues through brainstorming.

## Usage

```
/issue           # Deep mode (brainstorm) - default
/issue quick     # Quick mode (fast save)
/issue #123      # Refine existing issue
```

## Deep Mode (default)

Full brainstorming session for new ideas.

### Flow

1. Read all documentation from `docs/*`
2. Ask user about the idea
3. Brainstorm iteratively (no fixed limit):
   - Clarify requirements and context
   - Suggest approaches, discuss trade-offs
   - Challenge assumptions, offer alternatives
   - Continue until BOTH sides agree the issue is ready
4. Capture decisions WITH reasons (why, not just what)
5. Show draft to user for approval:
   - Title: ...
   - Body: ...
   - Labels: ...
6. Create issue after user confirms
7. Return issue number and URL

### Issue Format

```markdown
## Summary
Brief description (1-2 sentences)

## Context
Why is this needed? What problem are we solving?

## Approach
Key decisions:
- Decision A (reason: ...)
- Decision B (reason: ...)

## Scope
- [ ] What's included
- [ ] What's included

## Out of scope (optional)
What we explicitly NOT doing

## Open questions (optional)
What's not decided yet
```

## Quick Mode

Fast save without deep analysis.

### Flow

1. Read all documentation from `docs/*`
2. Ask user for idea
3. Show draft to user for approval:
   - Title: ...
   - Body: ...
   - Labels: ...
4. Create issue after user confirms
5. Return issue number and URL

### Issue Format

```markdown
Brief description of the idea.

Context/reason (1-2 sentences, optional).
```

## Refine Mode

Continue brainstorming on existing issue.

### Flow

1. Read all documentation from `docs/*`
2. Read issue with comments: `gh issue view #123 --comments`
3. Brainstorm iteratively (same as deep mode):
   - Clarify requirements and context
   - Suggest approaches, discuss trade-offs
   - Challenge assumptions, offer alternatives
   - Continue until BOTH sides agree the issue is ready
4. Show draft to user for approval:
   - Title: ...
   - Body: ...
5. Update issue after user confirms

## Labels

**Scope:** `backend`, `frontend`, `deploy`

**Type:** `feat`, `chore`, `refactor`

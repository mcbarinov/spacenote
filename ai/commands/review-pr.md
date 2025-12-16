# /review-pr

Think hard and perform a comprehensive review of all changes in the current branch compared to main.

## Description

This command reviews the diff between current branch and main, checking for:

- **Bugs** - logic errors, race conditions, null/undefined issues
- **Architecture violations** - against docs/backend.md, docs/frontend.md, docs/concepts.md
- **Simplicity** - unnecessary complexity, over-engineering
- **Security** - injection, XSS, unsafe input handling
- **TypeScript** - any, as, improper typing
- **Error handling** - missing edge cases
- **Performance** - N+1 queries, unnecessary re-renders, inefficient operations
- **Consistency** - deviation from existing patterns
- **Dead code** - unused code left after changes
- **TODO/FIXME** - forgotten temporary markers

**Key principle**: Simple and small code is highly valued.

## Actions

1. Get the diff and changed files:
   - Run `git diff main...HEAD` to see all changes
   - Run `git diff --name-only main...HEAD` to get list of changed files

2. Read relevant documentation based on what changed:
   - Backend changes (`apps/backend/`) → `docs/backend.md`, `apps/backend/README.md`
   - Frontend changes (`apps/web/`, `apps/admin/`, `packages/`) → `docs/frontend.md`
   - Always read: `CLAUDE.md`, `ai/rules/project.md`, `docs/concepts.md`, `docs/ideas.md`

3. Review each changed file thoroughly:
   - Understand the context by reading surrounding code if needed
   - Check against documented architecture patterns
   - Look for the issues listed above

## Output Format

Group findings by severity:

**Critical** - bugs, security issues, data loss risks
**Important** - architecture violations, significant complexity
**Minor** - style, minor improvements, suggestions

For each finding:
- `file:line` - location
- What's wrong
- How to fix

End with a summary: what's good about the changes, what needs attention.

ultrathink

# /review-frontend

Think hard and perform an interactive code review of the frontend.

## Description

This command performs a comprehensive review of the frontend codebase, looking for:
- **Bugs** - logic errors, edge cases, potential runtime errors
- **Complexity** - over-engineered code, unnecessary abstractions, premature optimizations
- **Architecture** - improvements possible given prototype phase

**Key principle**: Simple and small code is highly valued. This project is in prototype phase - breaking changes are acceptable.

## Actions

1. Read frontend documentation:
   - `docs/concepts.md` - domain model
   - `docs/frontend.md` - architecture decisions
   - `apps/admin/README.md` - admin app structure
   - `apps/web/README.md` - web app structure
   - `packages/common/README.md` - shared package
   - `ai/rules/frontend.md` - AI-specific coding rules for frontend
   - `docs/ideas.md` - planned improvements (avoid suggesting already planned)

2. Read all frontend source code:
   - `packages/common/` - shared code
   - `apps/admin/` - admin panel
   - `apps/web/` - user app

3. Review the code interactively:
   - Discuss findings as you discover them
   - Ask clarifying questions when context is needed
   - Group related issues together
   - Reference specific files and line numbers
   - Prioritize: bugs first, then complexity, then architecture

## Response Style

Be direct and actionable. For each finding:
- What's the issue
- Where exactly (file:line)
- Why it matters
- How to fix (brief suggestion)

Don't list theoretical improvements - focus on real problems you see in the code.

ultrathink

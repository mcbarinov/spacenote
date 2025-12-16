# /review-backend

Think hard and perform an interactive code review of the backend.

## Description

This command performs a comprehensive review of the backend codebase, looking for:
- **Bugs** - logic errors, edge cases, potential runtime errors
- **Complexity** - over-engineered code, unnecessary abstractions, premature optimizations
- **Architecture** - improvements possible given prototype phase

**Key principle**: Simple and small code is highly valued. This project is in prototype phase - breaking changes are acceptable.

## Actions

1. Read backend documentation:
   - `docs/concepts.md` - domain model
   - `docs/backend.md` - architecture decisions
   - `apps/backend/README.md` - project structure
   - `ai/rules/backend.md` - AI-specific coding rules for backend
   - `docs/ideas.md` - planned improvements (avoid suggesting already planned)

2. Read all backend source code in `apps/backend/src/spacenote/` (exclude tests)

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

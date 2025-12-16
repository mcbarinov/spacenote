# /review-concepts

Think hard and perform a conceptual review of data modeling and domain concepts.

## Description

This command performs analysis of data organization and domain concepts:
- **Data organization** - collection structure, relationships, denormalization needs
- **Field completeness** - missing fields in system collections and field types for spaces
- **Concept coverage** - what's missing in docs/concepts.md

**Key principle**: Early data modeling decisions are critical. Better to fix schema now than migrate later.

**Not in scope**: Code quality, bugs, frontend/backend implementation (use other review commands).

## Actions

1. Read documentation:
   - `docs/concepts.md` - current domain model
   - `docs/backend.md` - database schema
   - `docs/space-examples.md` - use case examples
   - `docs/ideas.md` - planned future improvements

2. Read data models in code:
   - `apps/backend/src/spacenote/core/modules/*/models.py` - all models
   - `apps/backend/src/spacenote/core/modules/field/` - field types system

3. Analyze interactively - discuss findings as you go:

   **Data Organization:**
   - Are collections properly separated?
   - Should anything be denormalized for performance?
   - Are relationships between entities optimal?
   - Are natural keys (username, slug, number) the right choice?

   **Field Completeness:**
   - System collections (users, spaces, notes, comments) - missing fields?
   - Field types for spaces - are current types (string, markdown, boolean, select, tags, user, datetime, int, float, image) sufficient?
   - What new field types might be needed?

   **Concept Coverage:**
   - Are all code concepts documented in concepts.md?
   - What new space examples would be valuable?
   - Any implicit concepts that should be explicit?

## Response Style

Be direct. For each finding:
- What's the observation
- Why it matters (impact on future development)
- Concrete suggestion

Prioritize: data organization issues first, then field gaps, then documentation.

Ask clarifying questions when user context would help the analysis.

ultrathink

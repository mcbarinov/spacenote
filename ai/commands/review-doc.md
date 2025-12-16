# /review-doc

Think hard and perform a comprehensive review of project documentation.

## Description

This command reviews all documentation for:
- **Accuracy** - docs match current code (file paths, function names, API)
- **Brevity** - concise writing, no unnecessary words (AI agents need short context)
- **Simplification** - suggest cuts where possible
- **Consistency** - same terms used across all docs
- **Redundancy** - no duplicate info between documents
- **Structure** - proper heading hierarchy, uniform formatting
- **Examples** - code examples match current API

**Key principle**: Documentation is read by humans AND AI agents. Every sentence must earn its place.

## Actions

1. Read all documentation files:
   - `docs/concepts.md` - domain model
   - `docs/backend.md` - backend architecture
   - `docs/frontend.md` - frontend architecture
   - `docs/ideas.md` - future improvement ideas
   - `CLAUDE.md` - AI guidelines
   - `ai/rules/project.md` - project rules
   - `ai/rules/backend.md` - backend AI rules
   - `ai/rules/frontend.md` - frontend AI rules
   - `apps/backend/README.md` - backend structure
   - `apps/admin/README.md` - admin app
   - `apps/web/README.md` - web app (if exists)
   - `packages/common/README.md` - shared package

2. Cross-reference with code:
   - Verify file paths mentioned in docs exist
   - Check that described APIs/patterns match implementation
   - Confirm examples are runnable

3. Review interactively:
   - Report findings as you discover them
   - Group by document
   - Prioritize: inaccuracies first, then verbosity, then structure

## Response Style

For each finding:
- Document and location
- What's wrong
- Suggested fix (be brief)

Focus on actionable improvements. Don't praise what's good - only report problems.

ultrathink

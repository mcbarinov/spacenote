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

1. Cross-reference with code:
   - Verify file paths mentioned in docs exist
   - Check that described APIs/patterns match implementation
   - Confirm examples are runnable

2. Review interactively:
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

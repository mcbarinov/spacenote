# Claude Code Agent Instructions

This file contains technical instructions specifically for the Claude Code agent. Project architecture and general documentation should be found in the `docs/architecture/` directory.

## Required Reading

When starting work on this project, you MUST read:
1. This file (`CLAUDE.md`) - for Claude Code agent-specific instructions
2. `docs/architecture/concepts.md` - for core concepts and high-level overview
3. `docs/architecture/backend.md` - for backend architecture details
4. `docs/architecture/frontend.md` - for frontend implementation details

All files are mandatory reading. The architecture files contain information for both humans and other AI agents.

## Content Guidelines

- **No duplication**: Never duplicate information between `CLAUDE.md` and architecture docs
- `CLAUDE.md`: Technical instructions for Claude Code agent only
- `docs/architecture/`: Project architecture, design decisions, and general documentation


## Language Requirements

All content must be in English:
- Code comments
- Documentation
- Git commit messages
- Any other written content

## Communication Language

**ALWAYS communicate in English only**, regardless of the language used by the user. All responses must be in English.

## Backend Commands

**IMPORTANT**: When managing the backend, use these commands:
- **Start backend**: `just b-agent-start`
- **Stop backend**: `just b-agent-stop`
- **NEVER use**: `just b-dev` (this is for human developers only)

## Current Project State

**Phase**: Prototyping
- We can modify any data structures as needed
- Breaking changes are acceptable
- We are NOT writing tests at this stage
- Focus is on rapid iteration and exploration

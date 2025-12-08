# SpaceNote Concepts

## Overview

SpaceNote is a note-taking system designed for small teams (1-10 users) with AI agent integration capabilities.

## Core Concepts

### Space

A space is a container that groups related notes. Each space represents a project or domain with:

- Unique field schema defining note structure
- Up to 100 spaces per deployment
- Isolated data organization

### Note

Basic content unit within a space. Notes:

- Belong to exactly one space
- Follow space's field schema
- Support various field types

### Fields

Dynamic schema system where each space defines its own fields:

- **Types**: string, markdown, boolean, select, tags, user, datetime, int, float, image
- **Properties**: required/optional, default values, type-specific options
- Fields are space-specific, enabling flexible data modeling

### Users & Permissions

- Small team focus (1-10 users)
- Space-level access control
- Members have full access to their spaces
- User management (creating and deleting users) is restricted to administrators only
- Administrators cannot be members of spaces (admins manage system, regular users create content)
- Users and spaces are cached in-memory for performance (see backend architecture docs)

### Comments

- Threaded discussions on notes
- Support for replies to create conversation threads
- User attribution for all comments
- Timestamp tracking for activity history

### Attachments

File attachments for notes and spaces:

- **Note-level**: files attached to specific notes (images, documents, etc.)
- **Space-level**: files attached to space itself, useful for AI context documents
- Sequential numbering per note or per space
- Stored on local filesystem

### Image Fields

IMAGE field type for notes with automatic processing:

- Accepts pending attachment number, converts to permanent attachment on note save
- Auto-converts to WebP format (85% quality)
- Optional `max_width` option for resizing
- Async processing (doesn't block note creation)
- Separate storage for originals (attachments) and processed images

### Telegram Integration

Each space can connect to Telegram channels for two types of integration:

- **activity** — Event feed. Posts notifications when notes are created/updated or comments are added. One-way broadcast of activity to a channel.

- **mirror** — Note mirroring. Creates a Telegram post for each note and keeps it in sync. When note is edited, the corresponding Telegram post is updated.

Configuration per space:
- `telegram_activity_channel` — channel for activity feed (e.g. `@mychannel` or `-1001234567890`)
- `telegram_mirror_channel` — channel for note mirroring

Message formatting via Liquid templates in `Space.templates`:
- `telegram:activity:note_created`
- `telegram:activity:note_updated`
- `telegram:activity:comment_created`
- `telegram:mirror`

### AI Integration

Built with AI agents in mind:

- Structured data format for easy analysis
- API access for agent interactions
- Field types optimized for machine processing

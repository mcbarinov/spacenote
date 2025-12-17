# SpaceNote Concepts

> Read first. Describes domain model, features, and key architectural decisions.

SpaceNote is a note-taking system designed for small teams (1-10 users) with AI agent integration capabilities.

## 1. Domain Model

### 1.1 Space

A container that groups related notes. Each space represents a project or domain with:

- Unique slug identifier (e.g., `task-tracker`, `food-journal`)
- Custom field schema defining note structure
- List of members who can access the space
- Up to 100 spaces per deployment

### 1.2 Note

Basic content unit within a space:

- Belongs to exactly one space
- Identified by sequential number within space (e.g., note #7 in `task-tracker`)
- Follows space's field schema
- Tracks author and timestamps (created, edited, last activity)

### 1.3 Fields

Dynamic schema system where each space defines its own fields:

- **Types**: string, boolean, select, tags, user, datetime, numeric, image
- **Properties**: required/optional, default values, type-specific options
- Fields are space-specific, enabling flexible data modeling

See `docs/fields.md` for detailed field types, options, and VALUE_MAPS reference.

### 1.4 User

System user account:

- Identified by username
- Single administrator: user with `username="admin"`
- All other users are regular users who can be members of spaces
- Administrator cannot be a member of spaces

**Intentionally simple**: No self-registration, password recovery, or display names. For small teams where the admin creates all accounts manually.

### 1.5 Comment

Threaded discussions on notes:

- Identified by sequential number within note
- Support for replies (parent-child threading)
- Tracks author and timestamps

### 1.6 Attachment

File attachments for notes and spaces:

- **Note-level**: files attached to specific notes (images, documents, etc.)
- **Space-level**: files attached to space itself, useful for AI context documents
- Identified by sequential number within note or space

### 1.7 Filter

Saved query configurations for notes within a space:

- Unique name within space (e.g., `all`, `active`, `archived`)
- Conditions with field + operator + value (combined with AND)
- Sort order (field names with optional `-` prefix for descending)
- Default columns for notes list view
- Every space has default `all` filter

### 1.8 Template

Liquid templates for rendering notes and messages:

- Stored per space as key-value pairs
- Keys: `note:title`, `web:note:detail`, `web:note:list:{filter}`, `telegram:*`
- Used for note titles, web layouts, Telegram messages
- Default templates provided for common cases

## 2. Features Overview

### 2.1 Telegram Integration

Each space can connect to Telegram channels:

- **Activity feed**: posts notifications when notes are created/updated or comments are added
- **Note mirroring**: creates a Telegram post for each note and keeps it in sync

### 2.2 AI Integration

Built with AI agents in mind:

- Structured data format for easy analysis
- REST API access for agent interactions
- Field types optimized for machine processing

### 2.3 Templates

Customizable rendering via Liquid templates:

- Note title generation
- Web page layouts (note detail, note list)
- Telegram message formatting

### 2.4 Image Processing

IMAGE field type with automatic optimization:

- Converts uploaded images to WebP format
- Optional resizing via `max_width` option
- See `docs/backend.md` for technical details

## 3. Key Architectural Decisions

### 3.1 Natural Keys

Entities are identified by natural keys, not MongoDB ObjectIds:

| Entity | Natural Key |
|--------|-------------|
| User | `username` |
| Space | `slug` |
| Note | `space_slug` + `number` |
| Comment | `space_slug` + `note_number` + `number` |
| Attachment | `space_slug` + `note_number` + `number` |

API endpoints and URLs use these natural keys (e.g., `/api/v1/spaces/task-tracker/notes/7`).

### 3.2 In-Memory Caching

Users and spaces are cached in memory due to small system limits:

- Backend: `dict[str, User]` and `dict[str, Space]` loaded on startup
- Frontend: TanStack Query cache, preloaded in auth layout
- Reads served from cache without database/API queries
- Cache refreshed after mutations

### 3.3 Image Storage

IMAGE fields store attachment numbers, not image data directly:

- **Original preserved**: Attachments keep the original uploaded file
- **IMAGE field**: References processed version (WebP, resized)

Why store originals:

- EXIF metadata preservation (location, camera info, timestamps)
- Future regeneration with different parameters (size, format, compression)

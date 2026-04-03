# SpaceNote Concepts

> Read first. Describes domain model, features, and key architectural decisions.

SpaceNote is a note-taking system designed for small teams (1-10 users) with AI agent integration capabilities.

## 1. Domain Model

### 1.1 Space

A container that groups related notes. Each space represents a project or domain with:

- Unique slug identifier (e.g., `task-tracker`, `food-journal`)
- Custom field schema defining note structure
- Members with per-member permissions (`all`, `create_note`, `create_comment`)
  - Membership alone = read-only access
  - `create_note` = can create/edit notes and upload attachments
  - `create_comment` = can create/edit comments
  - `all` = full access including space management
- Timezone (IANA format, default: `UTC`) — used for `$now` in `local`/`date` datetime fields
- Up to 100 spaces per deployment

### 1.1.1 Space Inheritance (Parent-Child)

A space can reference a parent space via `parent` field (set at creation time, immutable after).
Child space inherits fields, filters, and templates from parent, eliminating duplication when
multiple spaces share the same structure (e.g., a family of 5 with one shared task tracker + 5 personal ones).

**Constraints:**
- One level only — parent must not be a child itself (no grandchildren)
- `parent` is set at creation time and cannot be changed later
- `source_space` and `parent` are mutually exclusive in create
- Cannot delete a space that has children

**Inheritance rules per field:**

| Field | Strategy | Details |
|-------|----------|---------|
| `slug` | Identity | Unique identifier, not inherited |
| `parent` | Structural | Parent reference, not inherited |
| `title` | Per-space | Each space has its own title |
| `description` | Per-space | Each space has its own description |
| `members` | Per-space | Each space has its own members and permissions |
| `fields` | **Merge (append)** | Parent fields first, then child's own fields appended. Name collisions forbidden |
| `filters` | **Merge (override by name)** | Parent filters first; child can override by same name (child wins) |
| `templates` | **Merge (override by key)** | Parent templates as base; child can override by same key (child wins) |
| `default_filter` | Per-space | Each space picks its own default filter |
| `hidden_fields_on_create` | **Merge (union)** | Union of parent + child lists. Child cannot "unhide" a field hidden by parent |
| `editable_fields_on_comment` | **Merge (union)** | Union of parent + child lists. Child cannot remove a permission set by parent |
| `can_transfer_to` | Per-space | Schema compatibility depends on each space's full field set |
| `telegram` | Per-space | Each space has its own Telegram integration |
| `timezone` | Per-space | Each space has its own timezone |
| `created_at` | Metadata | Not inherited |

**Implementation:**
- MongoDB stores only the space's own config (`_space_documents` cache)
- Resolved (merged) config is computed in memory (`_resolved_spaces` cache)
- `get_space()` returns resolved view — all downstream code works unchanged
- `get_space_document()` returns raw DB document — used for mutations and export
- When parent changes, all children's resolved caches are rebuilt automatically

**Mutation rules for child spaces:**
- Can add/remove/update only own fields, filters, templates
- Attempting to modify inherited items returns "inherited from parent" error
- Adding a filter with the same name as parent's creates an override (not an error)
- Child space is created with no own filters — inherits parent's filters including "all"

### 1.2 Note

Basic content unit within a space:

- Belongs to exactly one space
- Identified by sequential number within space (e.g., note #7 in `task-tracker`)
- Follows space's field schema
- Tracks author and timestamps (created, edited, last activity)

### 1.3 Fields

Dynamic schema system where each space defines its own fields:

- **Types**: string, boolean, select, tags, user, datetime, numeric, image, recurrence
- **Properties**: required/optional, default values, type-specific options
- Fields are space-specific, enabling flexible data modeling

See `docs/fields.md` for detailed field types, options, and VALUE_MAPS reference.

### 1.4 User

System user account:

- Identified by username
- Any user can be marked as admin via `is_admin` flag
- Admin manages system-level operations (users, telegram tasks, pending attachments, import)
- `is_admin` gives no special access to spaces — space access is only through membership
- Default `admin` user is created on first startup with password `admin`

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
- Spaces use two-layer cache: `_space_documents` (raw MongoDB data) and `_resolved_spaces` (with parent inheritance merged). All reads use resolved cache.
- Frontend: TanStack Query cache, preloaded in auth layout
- Reads served from cache without database/API queries
- Cache refreshed after mutations; parent space changes trigger rebuild of all children's resolved caches

### 3.3 Image Storage

IMAGE fields store attachment numbers, not image data directly:

- **Original preserved**: Attachments keep the original uploaded file
- **IMAGE field**: References processed version (WebP, resized)

Why store originals:

- EXIF metadata preservation (location, camera info, timestamps)
- Future regeneration with different parameters (size, format, compression)

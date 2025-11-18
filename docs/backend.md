# Backend Documentation

## Database Schema

### Collections

#### `users`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `username`: string (natural key, unique index)
- `password_hash`: string
- `created_at`: datetime

#### `sessions`
- `_id`: ObjectId (surrogate key, MongoDB internal use only)
- `username`: string (references user, indexed)
- `auth_token`: string (unique index)
- `created_at`: datetime (TTL index: 30 days)

#### Planned Collections
- `spaces` - Not yet implemented
- `notes` - Not yet implemented

## Architecture Decisions

### Natural Keys vs Surrogate Keys

**Implementation**: Natural keys are used as primary identifiers throughout the API and application code:

- `User` → identified by `username`
- `Space` → identified by `slug` (planned)
- `Note` → identified by `space_slug + number` (planned)

**Surrogate keys**: `_id: ObjectId` exists in all MongoDB documents but is used only internally by MongoDB, never in application code or API endpoints.

**Benefits**:
- Readable URLs: `/users/john-doe`, `/spaces/my-project/notes/42`
- Semantic identifiers that convey meaning
- Simplified caching with natural keys as cache indexes
- Direct lookups without additional queries
- User-friendly identifiers in logs and debugging

**Trade-offs**:
- Renaming requires updating all references (acceptable for project constraints)
- Slightly larger document sizes due to denormalization

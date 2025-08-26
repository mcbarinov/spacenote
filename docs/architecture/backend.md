# SpaceNote Backend Architecture

## System Overview

SpaceNote backend uses a layered architecture built on:

- **FastAPI** - Async web framework with automatic OpenAPI generation
- **MongoDB** - Document database with async driver (pymongo)
- **Python 3.13** - Type-safe async/await programming

## Architecture Layers

### Core Layer (`spacenote.core`)
Business logic layer organized by domain concepts:

```
core/
├── user/            # User domain (models.py, service.py)
├── space/           # Space domain (models.py, service.py)  
├── note/            # Note domain (models.py, service.py)
├── comment/         # Comment domain (models.py, service.py)
├── session/         # Session domain (models.py, service.py)
├── field/           # Field domain (models.py)
├── filter/          # Filter domain (models.py)
├── counter/         # Sequential counters (models.py, service.py)
├── app.py           # Application facade layer
├── config.py        # Core configuration
├── core.py          # Application lifecycle and service registry
├── db.py            # MongoDB base models and ObjectId handling
├── errors.py        # Custom exception hierarchy
├── logging.py       # Structured logging setup
└── utils.py         # Shared utilities
```

### Web Layer (`spacenote.web`)
HTTP interface layer with FastAPI:

```
web/
├── routers/         # API endpoints (auth, spaces, notes)
├── schemas.py       # API response/request models
├── deps.py          # FastAPI dependency injection
├── server.py        # FastAPI app configuration
├── config.py        # Web-specific configuration
├── openapi.py       # OpenAPI customization
└── error_handlers.py # HTTP error mapping
```

## Architecture Patterns

### Concept-Based Organization
Each domain concept has its own module containing:
- **Models**: Pydantic models for data structures
- **Service**: Business logic and database operations
- **Utilities**: Pure functions for stateless operations

### Core Class - Central Orchestrator
Manages service lifecycle, database connections, configuration, and application startup/shutdown.

### App Class - Client Interface
Primary interface for clients providing:
- Access control enforcement
- User context management
- Delegation to services (no business logic)

### Service Layer Pattern
Services handle all business logic and data access:
- Database operations (CRUD)
- In-memory caching for performance
- Cross-service coordination via `self.core.services.*`
- Services are singletons managed by Core

### Pure Functions
Stateless business logic with no service dependencies or database access.

### API Schema Pattern
API endpoints never return core domain models directly. All responses use schema models from `web/schemas.py` with `from_core()` conversion methods. This separation enables API evolution independent of domain models.

## Domain Models

### User
- `username: str` - Unique identifier
- `password_hash: str` - bcrypt hashed password

### Space  
- `slug: str` - URL-friendly unique identifier
- `title: str` - Human-readable name
- `members: list[ObjectId]` - User IDs with access
- `fields: list[SpaceField]` - Custom field definitions
- `filters: list[Filter]` - Predefined query configurations
- `list_fields: list[str]` - Default columns for note lists
- `hidden_create_fields: list[str]` - Fields hidden in create forms
- `note_detail_template: str` - Optional Liquid template
- `note_list_template: str` - Optional Liquid template

### Note
- `space_id: ObjectId` - Reference to the space containing this note
- `number: int` - Sequential number within the space for URL generation
- `author_id: ObjectId` - Reference to the user who created the note
- `created_at: datetime` - When the note was created
- `edited_at: datetime | None` - Last time note fields were edited
- `fields: dict[str, FieldValueType]` - User-defined field values as defined in the Space

### Comment
- `note_id: ObjectId` - Reference to the parent note
- `number: int` - Sequential number within the note
- `author_id: ObjectId` - User who created the comment
- `content: str` - Markdown-formatted comment text
- `created_at: datetime` - Creation timestamp
- `parent_id: ObjectId | None` - For future threading support

### Field System
- **Types**: string, markdown, boolean, choice, tags, user, datetime, int, float
- **Options**: min/max for numeric, values for choice fields  
- **Validation**: Required flag, type constraints, option validation

### Filter System
- **Conditions**: Field + operator + value combinations
- **Operators**: eq, ne, contains, startswith, endswith, in, nin, all, gt, gte, lt, lte
- **Sorting**: Multi-field with direction control
- **Display**: Custom column selection

### Session
- `user_id: ObjectId` - Reference to authenticated user
- `auth_token: str` - Secure token for authentication
- `created_at: datetime` - Session creation timestamp

## Services

### UserService
- User CRUD operations with username uniqueness
- Password hashing with bcrypt
- In-memory user cache for performance
- Auto-creation of admin user on startup

### SpaceService  
- Space CRUD with slug validation
- Member-based access control
- In-memory space cache
- Field and filter management

### NoteService
- Note CRUD operations within spaces
- Sequential numbering via CounterService
- Space-based listing and filtering
- Custom field data management
- Creation and editing tracking

### CommentService
- Comment CRUD operations
- Sequential numbering per note
- Author tracking and timestamps
- Markdown content support

### SessionService
- Token generation with secrets.token_urlsafe
- Session persistence in MongoDB
- 30-day TTL for sessions
- Token validation and user lookup

### CounterService
- Atomic sequential counters per collection
- Ensures unique numbering under concurrent access
- Used for note and comment numbering
- MongoDB findAndModify for atomicity

## Database Design

### MongoDB Collections
- `users` - User documents with password hashes
- `spaces` - Space configurations with fields and filters  
- `notes` - Note documents with custom field data and metadata
- `comments` - Comment documents linked to notes
- `sessions` - Authentication tokens with user references
- `counters` - Atomic counter documents for sequential numbering

### ObjectId **Handling**
- Custom `PyObjectId` type for Pydantic validation
- Automatic `_id` ↔ `id` field mapping for MongoDB compatibility
- Type-safe ObjectId operations throughout system

### Database Indexes
- `users.username` - Unique index for login lookups
- `spaces.slug` - Unique index for URL generation
- `notes.space_id + number` - Compound index for note lookups
- `comments.note_id + number` - Compound index for comment ordering
- `sessions.auth_token` - Index for token validation
- `counters._id` - Primary key for atomic operations

## Error Handling

### Service Layer
- Custom exceptions in `core/errors.py` hierarchy
- `NotFoundError` - Resource doesn't exist
- `AlreadyExistsError` - Duplicate resource
- `ValidationError` - Business rule violation
- `AuthenticationError` - Invalid credentials
- `AuthorizationError` - Insufficient permissions

### Web Layer
Error handlers map exceptions to HTTP responses:
- `NotFoundError` → 404
- `ValidationError` → 400
- `AuthenticationError` → 401
- `AuthorizationError` → 403
- Unexpected errors → 500 with logging

## Validation Strategy

### Field Validation
- Type checking via Pydantic models
- Field-specific validation based on type:
  - String fields: min/max length
  - Numeric fields: min/max values
  - Choice fields: allowed values
  - Tags fields: valid tag list
- Required field enforcement

### Business Logic Validation
- Username uniqueness in UserService
- Space slug format and uniqueness
- Member access checks in App layer
- Field schema compliance in NoteService

## Authentication Flow

1. Login endpoint validates credentials via UserService
2. SessionService creates secure token
3. Token stored in database and returned to client
4. Subsequent requests include token in header or cookie
5. Dependencies validate token and inject authenticated user

## Configuration

### Environment Variables
- `SPACENOTE_DATABASE_URL` - MongoDB connection string
- `SPACENOTE_DEBUG` - Debug logging toggle
- `SPACENOTE_BACKEND_HOST/PORT` - Server binding
- `SPACENOTE_SESSION_SECRET_KEY` - Session middleware secret
- `SPACENOTE_CORS_ORIGINS` - CORS configuration for frontend
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
├── user/            # User domain (models.py with domain + view, service.py)
├── space/           # Space domain (models.py with domain + view, service.py)  
├── note/            # Note domain (models.py with domain + view, service.py)
├── comment/         # Comment domain (models.py with domain + view, service.py)
├── session/         # Session domain (models.py, service.py)
├── field/           # Field domain (models.py with OpenAPI docs)
├── filter/          # Filter domain (models.py with OpenAPI docs)
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
├── routers/         # API endpoints with request/response models
│   ├── auth.py      # Auth endpoints + LoginRequest, LoginResponse
│   ├── users.py     # User endpoints + User, CreateUserRequest
│   ├── spaces.py    # Space endpoints + CreateSpaceRequest, UpdateSpaceMembersRequest
│   ├── notes.py     # Note endpoints + CreateNoteRequest
│   └── comments.py  # Comment endpoints + CreateCommentRequest
├── schemas.py       # Shared error response model only
├── deps.py          # FastAPI dependency injection
├── server.py        # FastAPI app configuration
├── config.py        # Web-specific configuration
├── openapi.py       # OpenAPI customization
└── error_handlers.py # HTTP error mapping
```

## Architecture Patterns

### Feature-Based Organization
Each domain feature has its own module containing:
- **Domain Models**: Core business entities with ObjectId references
- **View Models**: API representations with human-readable identifiers (for features that need them)
- **Service**: Business logic and database operations
- **Utilities**: Pure functions for stateless operations

Models are organized as:
- Features with ObjectId (user, space, note, comment) have both domain and view models in `models.py`
- Features without ObjectId (field, filter) only have domain models with OpenAPI documentation
- Request/Response models are defined locally in router files for better locality

### Core Class - Central Orchestrator
Manages service lifecycle, database connections, configuration, and application startup/shutdown.

### App Class - Client Interface
Primary interface for clients providing:
- Access control enforcement
- User context management
- Conversion from domain models to view models
- Returns view models for external consumption
- Delegation to services (no business logic)

### Service Layer Pattern
Services handle all business logic and data access:
- Database operations (CRUD)
- In-memory caching for performance
- Cross-service coordination via `self.core.services.*`
- Services are singletons managed by Core

### Pure Functions
Stateless business logic with no service dependencies or database access.

### View Models Architecture
View models are the external representation of domain models, defined alongside domain models in feature modules:
- **Purpose**: Provide clean API responses without internal implementation details
- **No ObjectIds**: Only human-readable identifiers (slug, username, number)
- **Location**: In `core/{feature}/models.py` next to domain models
- **Conversion**: Class methods convert from domain models with additional context
- **OpenAPI Integration**: Used directly for schema generation
- **Examples**:
  - `NoteView` in `core/note/models.py`: Contains `space_slug` and `author_username` instead of ObjectIds
  - `SpaceView` in `core/space/models.py`: Contains `member_usernames` instead of member IDs
  - Domain model has `author_id: ObjectId`, view model has `author_username: str`

### API Schema Pattern
API endpoints use different model types based on their purpose:
- **View Models**: From feature modules for responses (e.g., `NoteView`, `SpaceView`)
- **Domain Models without ObjectId**: Used directly (e.g., `SpaceField`, `Filter`)
- **Request Models**: Defined locally in router files for better locality
- FastAPI automatically generates OpenAPI schemas from all these models

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

## Identity Management

SpaceNote uses different types of identifiers at different layers of the architecture to balance performance, security, and user experience.

### Types of Identifiers

- **ObjectId**: MongoDB's internal identifier - fast, unique, used for foreign keys and indexing
- **slug**: URL-friendly identifier for Space (e.g., "my-tasks", "project-notes")
- **username**: Unique human-readable identifier for User
- **number**: Sequential integer for Note and Comment within their context (Space or Note respectively)

### Architectural Layers and ID Usage

#### 1. Service Layer (`core/*/service.py`)
- **Accepts ONLY ObjectId** in method parameters
- Never knows about slug, username, or number (with rare exceptions like UserService.verify_password for auth)
- Returns domain models containing ObjectId references
- Example:
  ```python
  async def get_note(self, note_id: ObjectId) -> Note
  async def update_members(self, space_id: ObjectId, member_ids: list[ObjectId]) -> Space
  ```

#### 2. App Layer (`core/app.py`)
- **Public methods accept human-readable identifiers** (slug, username, number)
- **Private `_resolve_*` methods** perform translation from human-readable to ObjectId
- **Passes only ObjectId to services**
- **Returns view models instead of domain models**
- Serves as the single point of ID translation in the system
- Example:
  ```python
  # Public method accepts human-readable IDs and returns view model
  async def get_note_by_number(self, auth_token: AuthToken, space_slug: str, number: int) -> NoteView:
      space = self._resolve_space(space_slug)  # Resolve slug to Space object
      await self._core.services.access.ensure_space_member(auth_token, space.id)
      note = await self._core.services.note.get_note_by_number(space.id, number)  # Get domain model
      author = self._core.services.user.get_user(note.author_id)  # Get author for username
      return NoteView.from_domain(note, space_slug, author.username)  # Return view model
  ```

#### 3. Web Layer (`web/routers/*`)
- **Uses URL-friendly identifiers** in endpoint paths
- Passes these identifiers to App layer without modification
- **Returns view models directly** without any conversion
- Example:
  ```python
  @router.get("/spaces/{space_slug}/notes/{number}", response_model=NoteView)
  async def get_note(space_slug: str, number: int, app: AppDep, auth_token: AuthTokenDep) -> NoteView:
      return await app.get_note_by_number(auth_token, space_slug, number)  # Direct return of view model
  ```

### Benefits of This Architecture

1. **Performance**: Services work with fast ObjectId lookups internally
2. **Security**: Internal database IDs are never exposed in URLs or APIs
3. **User Experience**: URLs are readable and memorable (e.g., `/spaces/my-tasks/notes/42`)
4. **Flexibility**: Can change slugs without breaking internal references
5. **Clean Separation**: Each layer has clear responsibilities for ID handling

### Resolution Pattern in App Class

The App class contains private resolver methods that handle all ID translation:

```python
def _resolve_space(self, slug: str) -> Space
def _resolve_user(self, username: str) -> User
async def _resolve_note(self, space_slug: str, number: int) -> tuple[Space, Note]
```

These methods centralize the resolution logic and ensure consistency across the application.

## Authentication Flow

1. Login endpoint validates credentials via UserService
2. App layer resolves username to user ID
3. SessionService creates secure token with user ID
4. Token stored in database and returned to client
5. Subsequent requests include token in header or cookie
6. Dependencies validate token and inject authenticated user

## Configuration

### Environment Variables
- `SPACENOTE_DATABASE_URL` - MongoDB connection string
- `SPACENOTE_DEBUG` - Debug logging toggle
- `SPACENOTE_BACKEND_HOST/PORT` - Server binding
- `SPACENOTE_SESSION_SECRET_KEY` - Session middleware secret
- `SPACENOTE_CORS_ORIGINS` - CORS configuration for frontend
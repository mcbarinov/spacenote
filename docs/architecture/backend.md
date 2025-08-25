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
├── session/         # Session domain (models.py, service.py)
├── field/           # Field domain (models.py)
├── filter/          # Filter domain (models.py)
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
Responsibilities:
- Service lifecycle management
- Database connection handling
- Configuration management
- Startup/shutdown orchestration

### App Class - Client Interface
The ONLY interface clients should use:
- **Primary responsibility**: Access control enforcement
- User context management
- Direct delegation to services (no business logic)

### Service Layer Pattern
Services handle all business logic and data access:
- Database operations (CRUD)
- In-memory caching for performance
- Business logic enforcement
- Cross-service coordination via `self.core.services.*`

**Service Access Rules:**
- Services ONLY access other services through `self.core.services.*`
- Never pass services as parameters to functions
- Services are singletons managed by Core

### Pure Functions
Stateless business logic organized as pure functions:
- Work with simple data types only
- No service dependencies or database access
- Same input always produces same output

### API Schema Pattern
**Critical Rule**: API endpoints NEVER return core domain models directly.

All API responses use schema models defined in `web/schemas.py`:
- **Clean names**: API schemas use simple names (`Note`, `Space`, `User`)
- **Conversion method**: Each schema has `from_core()` class method for converting domain models
- **Type safety**: Full type checking from database to API response
- **API contract**: Schemas define the public API contract, separate from internal models

Example:
```python
# In web/schemas.py
class Note(BaseModel):
    @classmethod
    def from_core(cls, note: "NoteModel") -> "Note":
        return cls.model_validate(note.model_dump(mode="json"))

# In routers
@router.get("/notes")
async def list_notes(...) -> list[Note]:
    notes = await app.get_notes(...)
    return [Note.from_core(note) for note in notes]
```

This separation allows:
- API evolution without changing domain models
- Different representations for different endpoints
- Clean OpenAPI documentation
- Hiding internal implementation details

## Request Flow

**Standard Flow:**
```
Client Request 
  → Web Router (parse request)
  → App (access control check)
  → Service (business logic + validation)
  → Database (data persistence)
  → Service (return domain model)
  → Router (convert to API schema via from_core())
  → Client (JSON response)
```

**Design Principles:**
- **Web layer**: Request parsing, schema conversion, response formatting
- **App layer**: Only access control, then delegate to services
- **Service layer**: All business logic, validation, and data operations
- **Schema layer**: Clean API contract, separate from domain models

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
- `author_id: ObjectId` - Reference to the user who created the note
- `created_at: datetime` - When the note was created
- `edited_at: datetime | None` - Last time note fields were edited
- `fields: dict[str, FieldValueType]` - User-defined field values as defined in the Space

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
- Space field and filter management

### NoteService
- Note CRUD operations within spaces
- Space-based note listing and filtering
- Custom field data management
- Note creation and editing tracking

### SessionService
- Token-based authentication with secrets.token_urlsafe
- Session persistence in MongoDB
- User authentication and authorization

## Database Design

### MongoDB Collections
- `users` - User documents with password hashes
- `spaces` - Space configurations with fields and filters  
- `notes` - Note documents with custom field data and metadata
- `sessions` - Authentication tokens with user references

### ObjectId Handling
- Custom `PyObjectId` type for Pydantic validation
- Automatic `_id` ↔ `id` field mapping for MongoDB compatibility
- Type-safe ObjectId operations throughout system

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

### Development Commands
- Development: `just b-dev` with file watching
- AI Agents: `just b-agent-start` with background process
- Production: Standard uvicorn deployment
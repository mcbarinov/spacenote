# Backend Architecture

## Tech Stack

- **Python**: 3.13+, strict typing (mypy), ruff linting
- **Framework**: FastAPI with async/await
- **Database**: MongoDB (AsyncMongoClient)
- **Validation**: Pydantic v2
- **Logging**: structlog

## Directory Structure

```
apps/backend/src/spacenote/
├── core/
│   ├── modules/
│   │   ├── user/          # String IDs, password hashing, validators
│   │   ├── session/       # ObjectId, 30-day TTL, token auth
│   │   └── access/        # Permission checks
│   ├── core.py            # Core container + ServiceRegistry
│   ├── service.py         # Service base class
│   └── db.py              # PyObjectId, MongoModel
├── web/
│   ├── routers/
│   │   ├── auth.py        # Login/logout
│   │   ├── profile.py     # User profile
│   │   └── users.py       # User management (admin)
│   ├── server.py          # FastAPI app + lifespan
│   ├── deps.py            # Auth dependencies
│   ├── openapi.py         # Custom OpenAPI schema
│   └── error_handlers.py # Exception → HTTP mapping
├── app.py                 # Application facade
├── config.py              # Pydantic Settings
├── errors.py              # Custom exceptions
├── logging.py             # Logging setup
├── main.py                # Entry point
└── utils.py
```

## Architecture Layers

```
FastAPI Routers → App Facade → Core Container → Services → MongoDB
```

**Flow:**
1. Router receives HTTP request
2. Dependency injection provides `App` instance + auth token
3. App validates permissions via AccessService
4. App delegates to appropriate service
5. Service performs business logic + database operations

## Core Components

### ServiceRegistry (`core/core.py`)

```python
class ServiceRegistry:
    user: UserService
    session: SessionService
    access: AccessService

    async def start_all()  # Initialize all services
    async def stop_all()   # Cleanup all services
```

### Service Base (`core/service.py`)

```python
class Service:
    database: AsyncIOMotorDatabase  # MongoDB access
    core: Core                      # Container reference

    async def on_start()  # Optional lifecycle hook
    async def on_stop()   # Optional lifecycle hook
```

Services access each other via `self.core.services.<service_name>`.

### App Facade (`app.py`)

Entry point for all operations. Validates permissions before delegating to services.

```python
class App:
    core: Core
    access: AccessService

    # Methods validate auth/permissions, then call services
```

## Current Modules

### User Module (`core/modules/user/`)

**ID Strategy:** String-based (username as ID)

**Files:**
- `models.py` - User, UserCreate, UserUpdate, UserPassword
- `service.py` - UserService with in-memory cache
- `password.py` - bcrypt hashing
- `validators.py` - user_id, password validation

**Key Features:**
- All users cached in memory
- Default admin user creation
- Password complexity requirements
- Unique username constraint

### Session Module (`core/modules/session/`)

**ID Strategy:** ObjectId-based

**Files:**
- `models.py` - Session, AuthToken (NewType[str])
- `service.py` - SessionService with auth cache

**Key Features:**
- 30-day TTL with MongoDB index
- Token = base64(session_id)
- In-memory cache: token → user_id
- Automatic cleanup via TTL index

### Access Module (`core/modules/access/`)

**Files:**
- `service.py` - AccessService

**Methods:**
```python
ensure_authenticated(token) → user_id  # Raises AuthenticationError
ensure_admin(token) → user_id          # Raises AccessDeniedError
```

## Database Integration

### PyObjectId (`core/db.py`)

Pydantic v2 type for MongoDB ObjectIds:
- Validates ObjectId format
- Serializes to string in JSON
- Compatible with MongoDB BSON

### MongoModel (`core/db.py`)

Base class for models with MongoDB helpers:

```python
@staticmethod
def to_mongo(data: BaseModel) → dict  # Converts None → exclude

@staticmethod
async def list_cursor(cursor) → list[T]  # Async cursor → list
```

## Authentication

### Dual Auth Support

1. **Bearer Token**: `Authorization: Bearer <token>`
2. **Cookie**: `auth_token` HttpOnly cookie, 30-day expiration

### Dependencies (`web/deps.py`)

```python
AppDep = Annotated[App, Depends(get_app)]
AuthTokenDep = Annotated[AuthToken | None, Depends(get_auth_token)]
```

`get_auth_token()` checks both Authorization header and cookie.

### OpenAPI Security (`web/openapi.py`)

```python
security_schemes:
  BearerAuth: HTTP Bearer
  AuthTokenCookie: apiKey in cookie
```

Public endpoints: `/health`, `/openapi.json`, `/auth/login`

## API Routers

### Auth Router (`web/routers/auth.py`)

- `POST /auth/login` - Login with username/password, sets cookie
- `POST /auth/logout` - Logout, clears cookie

### Profile Router (`web/routers/profile.py`)

- `GET /profile/me` - Current user info
- `POST /profile/change-password` - Change own password

### Users Router (`web/routers/users.py`)

**Admin only:**
- `GET /users` - List all users
- `POST /users` - Create user
- `DELETE /users/{user_id}` - Delete user

## Error Handling

### Exception Hierarchy (`errors.py`)

```python
UserError                    # Base, 500
├── NotFoundError           # 404
├── AuthenticationError     # 401
├── AccessDeniedError       # 403
└── ValidationError         # 400
```

### Error Response Format

```json
{
  "message": "Error description",
  "type": "NotFoundError"
}
```

### Error Handlers (`web/error_handlers.py`)

Maps exceptions to HTTP status codes. Logs with structlog.

## Configuration

### Settings (`config.py`)

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='SPACENOTE_')

    database_url: str
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
```

Load from environment or `.env` file.

## Development Patterns

### Adding New Module

1. Create `core/modules/<name>/` directory
2. Add `models.py` with Pydantic models
3. Add `service.py` with Service subclass
4. Register service in `ServiceRegistry` (core/core.py)
5. Add App methods in `app.py`
6. Create router in `web/routers/`

### Service Communication

Services access each other via:
```python
other_service = self.core.services.<service_name>
```

### Caching Strategy

- **Users**: All cached in memory (small team assumption)
- **Sessions**: Active sessions cached by token
- **Spaces/Notes**: Not yet implemented

### Type Safety

- Strict mypy configuration
- No `Any` types in public APIs
- NewType for domain types (AuthToken)

## HTTP Conventions

### Response Codes

- `200` OK - Successful GET
- `201` Created - Successful POST
- `204` No Content - Successful DELETE
- `400` Bad Request - Validation error
- `401` Unauthorized - Not authenticated
- `403` Forbidden - Not authorized
- `404` Not Found - Resource missing

### JSON Serialization

- ObjectId → string
- datetime → ISO 8601
- None fields excluded from response

## Future Modules

Planned from old architecture (not yet implemented):

- `space/` - Space management
- `note/` - Note CRUD
- `field/` - Custom fields
- `comment/` - Comment system
- `counter/` - ID generation
- `filter/` - Query filters
- `export/` - CSV/JSON export
- `attachment/` - File attachments
- `image/` - Image processing
- `llm/` - LLM integration
- `telegram/` - Telegram bot

## Key Changes from Old Backend

- **Monorepo**: `apps/backend/` instead of separate repo
- **MVP Scope**: 3 modules vs 14 (incremental implementation)
- **ServiceRegistry**: Explicit typed registry vs dynamic discovery
- **Pydantic v2**: Updated models and validation
- **Dual Auth**: Added cookie support for browser clients
- **Structured Logging**: structlog instead of basic logging

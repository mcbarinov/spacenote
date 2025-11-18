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

### Layered Architecture with App Facade

**Implementation**: Clear separation of concerns across layers:

```
FastAPI Routers → App Facade → Core Container → Services → MongoDB
```

- **Web layer** (`web/routers/`) handles HTTP concerns only (request/response, validation)
- **App Facade** (`app.py`) is the sole entry point to business logic
  - Validates authentication and permissions before delegating
  - Composes operations from multiple services
  - Provides simplified API hiding Core complexity
- **Core Container** (`core/core.py`) manages lifecycle and provides ServiceRegistry
- **Services** (`core/modules/*/service.py`) execute business logic and database operations

**Benefits**:
- Clear separation: web concerns vs business logic
- Centralized permission enforcement - all operations go through App Facade
- Web layer independent of Core internals
- Simplified testing - layers can be tested in isolation
- Type-safe service access through ServiceRegistry

### Service Registry & Lifecycle Management

**Implementation**: Centralized service management with coordinated lifecycle:

```python
class ServiceRegistry:
    user: UserService
    session: SessionService
    access: AccessService

    async def start_all()  # Initialize all services
    async def stop_all()   # Cleanup all services
```

**Lifecycle flow**:
1. Application startup triggers `Core.on_start()`
2. `ServiceRegistry.start_all()` calls each service's `on_start()` hook
3. Services create database indexes, load caches, ensure default data
4. On shutdown, `stop_all()` performs cleanup in reverse order

**Benefits**:
- Centralized lifecycle coordination
- Type-safe service access via typed attributes
- Guaranteed initialization order
- Single point of service registration
- Clean startup/shutdown with proper resource management

### Inter-Service Communication via Core Reference

**Implementation**: Services access each other through Core Container reference:

```python
# Each service has self.core reference
class Service:
    @property
    def core(self) -> Core:
        return self._core

# Services call each other via registry
async def get_authenticated_user(self, auth_token: AuthToken) -> User:
    session = await self._get_session(auth_token)
    user = self.core.services.user.get_user(session.username)
    return user
```

**Service dependency graph**:
```
AccessService → SessionService → UserService
```

**Benefits**:
- Transparent access to other services
- Type-safe calls through typed ServiceRegistry
- Explicit dependency relationships
- No additional DI framework needed
- Clear service boundaries

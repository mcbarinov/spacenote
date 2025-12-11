# Fields

Field system for custom note schemas. Each space defines its own fields.

## Field Types

| Type | Value Type | Description |
|------|-----------|-------------|
| `string` | `str` | Plain text |
| `markdown` | `str` | Markdown text |
| `boolean` | `bool` | True/false (`true`, `1`, `yes`, `on` / `false`, `0`, `no`, `off`) |
| `select` | `str` | Single choice from predefined values |
| `tags` | `list[str]` | Comma-separated list (auto-deduped) |
| `user` | `str` | Space member username |
| `datetime` | `datetime` | ISO 8601 datetime |
| `int` | `int` | Integer with optional min/max |
| `float` | `float` | Decimal with optional min/max |
| `image` | `int` | Attachment number (auto-converts to WebP) |

## Field Options

| Option | Applies To | Type | Description |
|--------|-----------|------|-------------|
| `values` | select | `list[str]` | **Required.** Allowed values |
| `value_maps` | select | `dict[str, dict[str, str]]` | Metadata maps for values |
| `min` | int, float | `number` | Minimum allowed value |
| `max` | int, float | `number` | Maximum allowed value |
| `max_width` | image | `int` | Max width in pixels for WebP conversion |

## Special Values

| Value | Applies To | Description |
|-------|-----------|-------------|
| `$me` | user | Current logged-in user |
| `$now` | datetime | Current timestamp (UTC) |

Can be used in `default` or as input value.

## Field Definition

```json
{
  "name": "field_name",
  "type": "string",
  "required": false,
  "default": null,
  "options": {}
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `str` | — | Unique identifier (alphanumeric, `_`, `-`) |
| `type` | `FieldType` | — | One of the types above |
| `required` | `bool` | `false` | Require non-empty value |
| `default` | varies | `null` | Default value (type-specific) |
| `options` | `dict` | `{}` | Type-specific options |

## VALUE_MAPS

Metadata mapping for `select` field values. Maps each value to display strings.

### Structure

```json
{
  "type": "select",
  "options": {
    "values": ["new", "in_progress", "done"],
    "value_maps": {
      "emoji": {
        "new": "🆕",
        "in_progress": "⏳",
        "done": "✅"
      },
      "label": {
        "new": "New",
        "in_progress": "In Progress",
        "done": "Done"
      }
    }
  }
}
```

### Validation Rules

1. Each map must cover ALL values (no missing keys)
2. Each map must NOT have extra keys beyond values
3. All mapped values must be strings

## Examples

### string

```json
{ "name": "title", "type": "string", "required": true }
```

### markdown

```json
{ "name": "body", "type": "markdown" }
```

### boolean

```json
{ "name": "is_archived", "type": "boolean", "default": false }
```

### select

```json
{
  "name": "status",
  "type": "select",
  "required": true,
  "default": "new",
  "options": {
    "values": ["new", "in_progress", "done"],
    "value_maps": {
      "emoji": { "new": "🆕", "in_progress": "⏳", "done": "✅" }
    }
  }
}
```

### tags

```json
{ "name": "labels", "type": "tags" }
```

Input: `"bug, feature, bug"` → Stored: `["bug", "feature"]`

### user

```json
{ "name": "assignee", "type": "user", "default": "$me" }
```

### datetime

```json
{ "name": "due_date", "type": "datetime", "default": "$now" }
```

Accepted formats:
- `2025-01-15T08:30:00`
- `2025-01-15T08:30`
- `2025-01-15 08:30:00`
- `2025-01-15`
- `2025-01-15T08:30:00.123456`
- `2025-01-15T08:30:00Z`

### int

```json
{ "name": "priority", "type": "int", "options": { "min": 1, "max": 5 } }
```

### float

```json
{ "name": "rating", "type": "float", "options": { "min": 0, "max": 10 } }
```

### image

```json
{ "name": "photo", "type": "image", "required": true, "options": { "max_width": 1280 } }
```

Value is attachment number. Image auto-converts to WebP with optional resize.

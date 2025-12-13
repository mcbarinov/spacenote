# Fields

Field system for custom note schemas. Each space defines its own fields.

## Field Types

| Type | Value Type | Description |
|------|-----------|-------------|
| `string` | `str` | Text with kind: single_line, multi_line, markdown, json, toml, yaml |
| `boolean` | `bool` | True/false (`true`, `1`, `yes`, `on` / `false`, `0`, `no`, `off`) |
| `select` | `str` | Single choice from predefined values |
| `tags` | `list[str]` | Comma-separated list (auto-deduped) |
| `user` | `str` | Space member username |
| `datetime` | `datetime` | ISO 8601 datetime |
| `numeric` | `int`, `float`, or `Decimal` | Number with kind: int, float, or decimal (precise) |
| `image` | `int` | Attachment number (auto-converts to WebP) |

## Field Options

| Option | Applies To | Type | Description |
|--------|-----------|------|-------------|
| `kind` | string | `"single_line"` \| `"multi_line"` \| `"markdown"` \| `"json"` \| `"toml"` \| `"yaml"` | String type (default: `"single_line"`) |
| `min_length` | string | `int` | Minimum string length |
| `max_length` | string | `int` | Maximum string length |
| `values` | select | `list[str]` | **Required.** Allowed values |
| `value_maps` | select | `dict[str, dict[str, str]]` | Metadata maps for values |
| `kind` | numeric | `"int"` \| `"float"` \| `"decimal"` | **Required.** Numeric type |
| `min` | numeric | `number` | Minimum allowed value |
| `max` | numeric | `number` | Maximum allowed value |
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

The `string` field type supports different kinds of text:

- **single_line**: Short text without newlines (e.g., title, name)
- **multi_line**: Long text with newlines (e.g., comment, description)
- **markdown**: Markdown-formatted text
- **json**: JSON text (will validate syntax)
- **toml**: TOML text (will validate syntax)
- **yaml**: YAML text (will validate syntax)

**Simple string (single line):**
```json
{ "name": "title", "type": "string", "required": true }
```

**Multi-line text:**
```json
{ "name": "description", "type": "string", "options": { "kind": "multi_line" } }
```

**Markdown:**
```json
{ "name": "body", "type": "string", "options": { "kind": "markdown" } }
```

**With length constraints:**
```json
{ "name": "slug", "type": "string", "options": { "kind": "single_line", "min_length": 3, "max_length": 50 } }
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

### numeric

The `numeric` field type supports three kinds of numbers:

- **int**: Integer values (stored as BSON Int32/Int64)
- **float**: Floating-point values (stored as BSON Double, IEEE 754)
- **decimal**: Precise decimal values (stored as BSON Decimal128, no floating-point errors)

Use `decimal` for financial calculations, currency, or any scenario requiring exact decimal precision.

**Integer:**
```json
{ "name": "priority", "type": "numeric", "options": { "kind": "int", "min": 1, "max": 5 } }
```

**Float:**
```json
{ "name": "rating", "type": "numeric", "options": { "kind": "float", "min": 0.0, "max": 10.0 } }
```

**Decimal (precise):**
```json
{ "name": "price", "type": "numeric", "options": { "kind": "decimal", "min": 0, "max": 999999.99 } }
```

### image

```json
{ "name": "photo", "type": "image", "required": true, "options": { "max_width": 1280 } }
```

Value is attachment number. Image auto-converts to WebP with optional resize.

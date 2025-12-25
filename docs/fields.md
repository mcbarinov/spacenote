# Fields

Field system for custom note schemas. Each space defines its own fields.

## 1. Field Definition

```json
{
  "name": "field_name",
  "type": "string",
  "required": false,
  "default": null,
  "options": { "kind": "line" }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `str` | — | Unique identifier (alphanumeric, `_`, `-`) |
| `type` | `FieldType` | — | One of the types below |
| `required` | `bool` | `false` | Require non-empty value |
| `default` | varies | `null` | Default value (type-specific) |
| `options` | `object` | — | Type-specific options (required, see each type) |

## 2. Field Types

### 2.1 string

Value: `str`

#### 2.1.1 Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `kind` | `"line"` \| `"text"` \| `"markdown"` \| `"json"` \| `"toml"` \| `"yaml"` | `"line"` | String format |
| `min_length` | `int` | — | Minimum length |
| `max_length` | `int` | — | Maximum length |

**Kind values:**
- `line` — single line, newlines forbidden
- `text` — multiline text, newlines allowed
- `markdown` — multiline markdown content
- `json`, `toml`, `yaml` — structured data formats

#### 2.1.2 Examples

```json
{ "name": "title", "type": "string", "required": true, "options": { "kind": "line" } }
```
```json
{ "name": "body", "type": "string", "options": { "kind": "markdown" } }
```
```json
{ "name": "slug", "type": "string", "options": { "kind": "line", "min_length": 3, "max_length": 50 } }
```
```json
{ "name": "description", "type": "string", "options": { "kind": "text" } }
```

### 2.2 boolean

Value: `bool`

#### 2.2.1 Options

No options. Use `"options": {}`.

#### 2.2.2 Parsing

Accepts: `true`, `1`, `yes`, `on` → true | `false`, `0`, `no`, `off` → false

#### 2.2.3 Examples

```json
{ "name": "is_archived", "type": "boolean", "default": false, "options": {} }
```

### 2.3 select

Value: `str`

#### 2.3.1 Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `values` | `list[str]` | Yes | Allowed values |
| `value_maps` | `dict[str, dict[str, str]]` | No | Metadata maps (see 2.3.2) |

#### 2.3.2 value_maps

Metadata mapping for values. Maps each value to display strings.

##### 2.3.2.1 Structure

```json
{
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
```

##### 2.3.2.2 Validation Rules

1. Each map must cover ALL values (no missing keys)
2. Each map must NOT have extra keys beyond values
3. All mapped values must be strings

#### 2.3.3 Examples

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

### 2.4 tags

Value: `list[str]`

#### 2.4.1 Options

No options. Use `"options": {}`.

#### 2.4.2 Parsing

Input: `"bug, feature, bug"` → Stored: `["bug", "feature"]` (comma-separated, auto-deduped)

#### 2.4.3 Examples

```json
{ "name": "labels", "type": "tags", "options": {} }
```

### 2.5 user

Value: `str`

#### 2.5.1 Options

No options. Use `"options": {}`.

#### 2.5.2 Special Values

`$me` — current logged-in user (can be used in `default` or as input value)

#### 2.5.3 Examples

```json
{ "name": "assignee", "type": "user", "default": "$me", "options": {} }
```

### 2.6 datetime

Value: `datetime`

#### 2.6.1 Options

No options. Use `"options": {}`.

#### 2.6.2 Special Values

`$now` — current timestamp UTC (can be used in `default` or as input value)

`$exif.created_at:{image_field}` — extract creation datetime from image EXIF metadata (only in `default`)

**Syntax**: `$exif.created_at:{image_field}` or `$exif.created_at:{image_field}|{fallback}`

| Component | Description |
|-----------|-------------|
| `{image_field}` | Name of an IMAGE field in the same space |
| `{fallback}` | Optional. Value if EXIF data missing: `$now`, datetime literal, or omit for null |

**EXIF tags**: Reads `DateTimeOriginal` (preferred) or `DateTime` (fallback). Timezone from `OffsetTimeOriginal` if present, otherwise UTC.

#### 2.6.3 Accepted Formats

- `2025-01-15T08:30:00`
- `2025-01-15T08:30`
- `2025-01-15 08:30:00`
- `2025-01-15`
- `2025-01-15T08:30:00.123456`
- `2025-01-15T08:30:00Z`

#### 2.6.4 Examples

```json
{ "name": "due_date", "type": "datetime", "default": "$now", "options": {} }
```

EXIF datetime from image (with `$now` fallback if no EXIF data):
```json
{ "name": "photo", "type": "image", "required": true, "options": {} }
{ "name": "taken_at", "type": "datetime", "default": "$exif.created_at:photo|$now", "options": {} }
```

### 2.7 numeric

Value: `int`, `float`, or `Decimal`

#### 2.7.1 Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `kind` | `"int"` \| `"float"` \| `"decimal"` | Yes | Numeric type |
| `min` | `number` | No | Minimum value |
| `max` | `number` | No | Maximum value |

Use `decimal` for financial calculations or any scenario requiring exact decimal precision.

#### 2.7.2 Examples

```json
{ "name": "priority", "type": "numeric", "options": { "kind": "int", "min": 1, "max": 5 } }
```
```json
{ "name": "rating", "type": "numeric", "options": { "kind": "float", "min": 0.0, "max": 10.0 } }
```
```json
{ "name": "price", "type": "numeric", "options": { "kind": "decimal", "min": 0, "max": 999999.99 } }
```

### 2.8 image

Value: `int` (attachment number)

#### 2.8.1 Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `max_width` | `int` | No | Max width in pixels for WebP conversion |

Image auto-converts to WebP with optional resize.

#### 2.8.2 Examples

```json
{ "name": "photo", "type": "image", "required": true, "options": { "max_width": 1280 } }
```
```json
{ "name": "avatar", "type": "image", "options": {} }
```

# Ideas

Future improvements and features.

## 1. Fields

### 1.1 New Field Types

#### 1.1.1 MULTI_SELECT

Select multiple values from a predefined list.

Unlike TAGS (free-form), values must come from a predefined list.

```json
{
  "name": "categories",
  "type": "multi_select",
  "options": { "values": ["docs", "api", "frontend", "backend"] }
}
```

**Alternative**: No new type. Extend SELECT with `options.multi = true`:

```json
{
  "name": "categories",
  "type": "select",
  "options": { "values": ["docs", "api", "frontend", "backend"], "multi": true }
}
```

#### 1.1.2 NOTE

Reference to another note within the same space.

Use cases: task dependencies, related items, parent-child relations.

```json
{
  "name": "blocked_by",
  "type": "note"
}
```

Value: note number (e.g., `42` for note #42).

#### 1.1.3 URL

Validated URL field with clickable rendering.

```json
{
  "name": "source_link",
  "type": "url",
  "options": {}
}
```

Could use STRING but loses URL validation and clickable rendering in UI.

### 1.2 Field Options

## 2. Notes

## 3. Users & Permissions

## 4. Spaces

## 5. Comments

## 6. Integrations

## 7. Frontend / UX

## 8. API

## 9. Developer Experience

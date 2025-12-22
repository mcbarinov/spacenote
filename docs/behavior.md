# Behavior Specifications

Non-obvious behavioral scenarios.

Reference format: `B{number}` (e.g., "see B001")

---

## B001: Note List View Resolution

**Page**: `/s/{space_slug}?filter={filter_name}&view={view_mode}`

**URL Parameters**:
- `filter` — filter name (defaults to `all`)
- `view` — `default` | `template` | `json` (optional)

**View resolution**:

If `?view` is specified:
- `default` → render table
- `json` → render JSON
- `template` → render template (only valid if template exists)

If `?view` is NOT specified (first match wins):
1. Template `web:note:list:{filter_name}` exists → render template
2. Template `web:note:list:all` exists → render template
3. Render table

**Table columns** (for `default` view, first match wins):
1. `Filter.default_columns` for `{filter_name}` if non-empty
2. `Filter.default_columns` for `all` filter (guaranteed non-empty by backend)

**Notes**:
- `?view=template` is only valid if template exists (for filter or `all`)
- If `filter` param is omitted, `filter_name` defaults to `all`

---

## B002: Telegram Mirror Message Formats

**Context**: Telegram API limits for mirror channel messages.

**Two formats:**

| Format | Template Directive | Telegram API | Char Limit |
|--------|-------------------|--------------|------------|
| text | (none) | sendMessage / editMessageText | 4096 |
| photo | `{# photo: field_name #}` | sendPhoto / editMessageCaption | 1024 |

**Format detection** (template `telegram:mirror`):
- First line `{# photo: <field_name> #}` → photo format, image from specified IMAGE field
- Otherwise → text format

**Template examples:**

Text format:
```liquid
<b>{{ note.fields.title }}</b>
{{ note.fields.description }}
```

Photo format:
```liquid
{# photo: image #}
<b>{{ note.fields.title }}</b>
{{ note.fields.description }}
```

**API methods:**

| Operation | text | photo |
|-----------|------|-------|
| Create | sendMessage | sendPhoto |
| Edit | editMessageText | editMessageCaption |

**Notes:**
- Multiple images not supported (Telegram limitation)
- Photo caption ≤1024 chars, text ≤4096 chars (Telegram enforced)

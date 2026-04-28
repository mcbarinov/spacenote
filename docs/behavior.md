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

**Constraint**: Telegram API does not allow changing message type after creation. Text messages can only be edited via `editMessageText`, photo messages only via `editMessageMedia`. Conversion between types is impossible.

**Configuration**: `TelegramSettings.mirror_channel` — single channel for note mirroring.

**Format determination**: Parsed from `telegram:mirror` template at task creation time.

| Template | Format | Telegram API |
|----------|--------|--------------|
| Has `{# photo: field_name #}` directive | `photo` | sendPhoto / editMessageMedia |
| No directive | `text` | sendMessage / editMessageText |

**Photo directive**: First line of template, specifies IMAGE field name. Stripped before sending.

```liquid
{# photo: image #}
<b>{{ note.fields.title }}</b>
{{ note.fields.description }}
```

**Storage**: `TelegramMirror.message_format` stores format (`text`/`photo`) used at creation for correct API selection on update.

**Character limits**:

| Format | Limit |
|--------|-------|
| text | 4096 chars |
| photo | 1024 chars (caption) |

**Behavior**:
1. Note created → parse template → determine format → create task
2. Note updated → lookup `TelegramMirror.message_format` → use corresponding API
3. Template changed → existing mirrors keep their format, new notes use new format

**Validation**:
- Template save: `{# photo: field_name #}` must reference existing IMAGE field in space schema
- Task processing: If photo field is empty/null → mark task as `failed`

---

## B003: Telegram Mirror Strict Ordering

**Constraint**: Telegram channel post order is fixed at send time and cannot be changed retroactively.

**Invariant**: Mirror tasks (`mirror_create`, `mirror_update`, `mirror_delete`) of one space are processed in strict FIFO order. Task N+1 must never publish before N succeeds.

**Per-space blocking**: If any mirror task of a space is `failed`, all pending mirror tasks of that space are frozen until the operator clears or repairs the failure. Activity tasks (`activity_*`) are not affected.

**Worker fetch**: Skip pending mirror tasks whose `space_slug` is in the set of spaces with at least one failed mirror task. Sort by `(created_at, number)` — `number` is the per-space tie-breaker for tasks enqueued in the same millisecond.

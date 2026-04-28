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

---

## B004: Telegram Mirror Channel Lifecycle

**Invariant**: While `TelegramSettings.mirror_channel` is set, the channel mirrors **all** notes of the space starting from note #1. Partial or split-channel mirrors are not legal states. Activity and mirror are configured via independent endpoints.

**API surface**:

| Method | Path | Purpose |
|---|---|---|
| `PUT` | `/api/v1/spaces/{slug}/telegram/activity` | Set or clear `activity_channel`. Free-form, no preconditions |
| `POST` | `/api/v1/spaces/{slug}/telegram/mirror` | Enable mirror on the given channel |
| `DELETE` | `/api/v1/spaces/{slug}/telegram/mirror` | Disable mirror and wipe DB-side mirror state |

**Mirror enable** (`POST /telegram/mirror`, body `{ channel: string }`) — handled by `TelegramService.enable_mirror`:

| Current state | Behavior |
|---|---|
| `mirror_channel == channel` | No-op (idempotent) |
| `mirror_channel is None` | Save settings, then enqueue `MIRROR_CREATE` for every note in `number` ASC order (backfill happens even on empty spaces — just enqueues nothing) |
| `mirror_channel != channel` (different non-None) | `ValidationError`; client must disable first |

**Mirror disable** (`DELETE /telegram/mirror`) — handled by `TelegramService.disable_mirror`:

| Current state | Behavior |
|---|---|
| `mirror_channel is None` | No-op (idempotent) |
| `mirror_channel is set` | Wipe `TelegramTask` rows where `task_type ∈ mirror_*` for the space + delete all `TelegramMirror` rows for the space, then save settings with `mirror_channel = null`. The Telegram channel itself is not modified — orphaned posts remain there |

**Activity channel is independent**: `set_activity_channel` only touches `activity_channel`. Activity tasks (`activity_*`) are never wiped by mirror lifecycle changes.

**In-flight worker race**: A `mirror_*` task may be picked up by the worker after disable started a wipe. Before processing any `mirror_*` task, the worker compares `task.channel_id` against the current `space.telegram.mirror_channel` — if it does not match (including the case where mirror is now disabled), the task is aborted without an API call.

**Re-enable**: After disable, the space has no DB record of past mirroring. If mirror is later enabled again (even on the same channel), backfill creates fresh posts; previously orphaned posts in the channel are not touched and not tracked.

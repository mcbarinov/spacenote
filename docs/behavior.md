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

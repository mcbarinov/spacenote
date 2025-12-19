# Behavior Specifications

Non-obvious behavioral scenarios.

Reference format: `B{number}` (e.g., "see B001")

---

## B001: Note List Template Resolution

**Page**: `/s/{space_slug}?filter={filter_name}`

**Context**: When rendering the note list, the system must determine what to display.

**Resolution order** (first match wins):

1. Template `web:note:list:{filter_name}` exists → render template
2. Template `web:note:list:all` exists → render template
3. `Filter.default_columns` for `{filter_name}` is non-empty → render table with these columns
4. `Filter.default_columns` for `all` filter → render table (guaranteed non-empty by backend)

**Notes**:
- If `filter` param is omitted, `filter_name` defaults to `all`
- Backend ensures `all` filter always has non-empty `default_columns`

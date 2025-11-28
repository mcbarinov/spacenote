# Space Examples

Space configuration examples.

---

## task-tracker

Simple task tracker for a small team.

### Space Definition

```json
{
  "slug": "task-tracker",
  "title": "Tasks",
  "description": "Team task tracker",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "body", "type": "markdown" },
    { "name": "assignee", "type": "user", "required": true, "default": "$me" },
    { "name": "status", "type": "select", "required": true, "default": "new",
      "options": { "values": ["new", "in_progress", "paused", "completed", "cancelled"] }
    },
    { "name": "priority", "type": "select", "required": true, "default": "medium",
      "options": { "values": ["low", "medium", "high"] }
    },
    { "name": "tags", "type": "tags" }
  ]
}
```

### Example Notes

```json
[
  {
    "number": 1,
    "author": "m",
    "fields": {
      "title": "Fix login page bug",
      "body": "Users can't login with email containing +",
      "assignee": "m",
      "status": "in_progress",
      "priority": "high",
      "tags": ["bug", "auth"]
    }
  },
  {
    "number": 2,
    "author": "f",
    "fields": {
      "title": "Update documentation",
      "body": null,
      "assignee": "f",
      "status": "new",
      "priority": "low",
      "tags": ["docs"]
    }
  },
  {
    "number": 3,
    "author": "m",
    "fields": {
      "title": "Weekly sync meeting",
      "body": "Discuss project roadmap",
      "assignee": "f",
      "status": "completed",
      "priority": "medium",
      "tags": null
    }
  }
]
```

---

## food-journal

Photo-based meal tracking with ratings.

### Space Definition

```json
{
  "slug": "food-journal",
  "title": "Food Journal",
  "description": "Photo-based meal tracking",
  "fields": [
    { "name": "image", "type": "image", "required": true, "options": { "max_width": 1280 } },
    { "name": "meal_time", "type": "datetime", "required": true, "default": "$now" },
    { "name": "ingredients", "type": "tags" },
    { "name": "tags", "type": "tags" },
    { "name": "taste", "type": "select", "options": { "values": ["1", "2", "3", "4", "5"] } },
    { "name": "afterfeel", "type": "select", "options": { "values": ["1", "2", "3", "4", "5"] } },
    { "name": "recipe", "type": "markdown" },
    { "name": "notes", "type": "markdown" }
  ]
}
```

### Example Notes

```json
[
  {
    "number": 1,
    "author": "alice",
    "fields": {
      "image": 1,
      "meal_time": "2025-01-15T08:30:00Z",
      "ingredients": ["eggs", "bacon", "toast"],
      "tags": ["breakfast", "protein"],
      "taste": "4",
      "afterfeel": "5",
      "recipe": null,
      "notes": "Quick morning meal before work"
    }
  },
  {
    "number": 2,
    "author": "bob",
    "fields": {
      "image": 1,
      "meal_time": "2025-01-15T19:00:00Z",
      "ingredients": ["pasta", "tomato", "basil", "parmesan"],
      "tags": ["dinner", "italian"],
      "taste": "5",
      "afterfeel": "4",
      "recipe": "1. Boil pasta\n2. Make sauce\n3. Combine",
      "notes": null
    }
  }
]
```

---

<!-- More examples will be added here -->

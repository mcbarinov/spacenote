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
    { "name": "title", "type": "string", "required": true, "options": { "kind": "line" } },
    { "name": "body", "type": "string", "options": { "kind": "text" } },
    { "name": "assignee", "type": "user", "required": true, "default": "$me", "options": {} },
    { "name": "status", "type": "select", "required": true, "default": "new",
      "options": { "values": ["new", "in_progress", "paused", "completed", "cancelled"] }
    },
    { "name": "priority", "type": "select", "required": true, "default": "medium",
      "options": { "values": ["low", "medium", "high"] }
    },
    { "name": "tags", "type": "tags", "options": {} }
  ]
}
```

### Example Notes

```json
[
  {
    "number": 1,
    "author": "bob",
    "fields": {
      "title": "Fix login page bug",
      "body": "Users can't login with email containing +",
      "assignee": "bob",
      "status": "in_progress",
      "priority": "high",
      "tags": ["bug", "auth"]
    }
  },
  {
    "number": 2,
    "author": "alice",
    "fields": {
      "title": "Update documentation",
      "body": null,
      "assignee": "alice",
      "status": "new",
      "priority": "low",
      "tags": ["docs"]
    }
  },
  {
    "number": 3,
    "author": "bob",
    "fields": {
      "title": "Weekly sync meeting",
      "body": "Discuss project roadmap",
      "assignee": "alice",
      "status": "completed",
      "priority": "medium",
      "tags": null
    }
  }
]
```

---

## food-journal

Photo-first meal tracking. Every entry starts with a photo — the timestamp is auto-extracted from EXIF.

**Purpose**: Build a visual eating diary to spot patterns and track reactions to food.

**Use cases**:
- Identify foods that cause negative reactions (heaviness, nausea, bloating)
- Track eating habits over time
- Remember what you ate at specific places or occasions

### Space Definition

```json
{
  "slug": "food-journal",
  "title": "Food Journal",
  "description": "Photo-based meal tracking",
  "fields": [
    { "name": "photo", "type": "image", "required": true, "options": { "max_width": 1280 } },
    { "name": "meal_time", "type": "datetime", "required": true, "default": "$exif.created_at:photo|$now", "options": {} },
    { "name": "foods", "type": "tags", "options": {} },
    { "name": "reactions", "type": "tags", "options": {} },
    { "name": "context", "type": "tags", "options": {} },
    { "name": "notes", "type": "string", "options": { "kind": "text" } }
  ]
}
```

### Fields

| Field | Purpose |
|-------|---------|
| photo | Visual record of the meal |
| meal_time | When (auto-extracted from photo EXIF, fallback to now) |
| foods | What was eaten: `oatmeal`, `soup`, `strawberries`, `pasta` |
| reactions | Taste and physical feedback: `delicious`, `too salty`, `overate`, `heaviness`, `nausea` |
| context | Setting and circumstances: `outdoors`, `home cooking`, `chinese restaurant`, `junk food` |
| notes | Anything else worth remembering |

### Example Notes

```json
[
  {
    "number": 1,
    "author": "bob",
    "fields": {
      "photo": 1,
      "meal_time": "2025-01-15T08:30:00Z",
      "foods": ["oatmeal", "banana", "honey"],
      "reactions": ["tasty", "light"],
      "context": ["breakfast", "home"],
      "notes": null
    }
  },
  {
    "number": 2,
    "author": "bob",
    "fields": {
      "photo": 2,
      "meal_time": "2025-01-15T13:00:00Z",
      "foods": ["pho", "spring rolls"],
      "reactions": ["delicious", "overate", "heaviness"],
      "context": ["vietnamese restaurant", "lunch with friends"],
      "notes": "The large portion was too much. Next time order small."
    }
  },
  {
    "number": 3,
    "author": "bob",
    "fields": {
      "photo": 3,
      "meal_time": "2025-01-16T19:30:00Z",
      "foods": ["grilled chicken", "salad", "bread"],
      "reactions": ["bland", "still hungry"],
      "context": ["outdoor bbq", "diet attempt"],
      "notes": null
    }
  }
]
```

---

<!-- More examples will be added here -->

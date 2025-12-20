_TELEGRAM_NOTE_CREATED = """\
📝 {{ note.title }}
-------------------
{% for field in note.fields %}
{{ field[0] }}: {{ field[1] }}
{% endfor %}
🔗 {{ url }}
by 👤 {{ note.author }}
"""

_TELEGRAM_NOTE_UPDATED = """\
✏️ {{ note.title }}
-------------------
{% for item in changes %}
{{ item[0] }}: {{ item[1][0] }} → {{ item[1][1] }}
{% endfor %}
🔗 {{ url }}
by 👤 {{ edited_by }}
"""

_TELEGRAM_COMMENT_CREATED = """\
💬 {{ note.title }}
-------------------
{{ comment.content }}
🔗 {{ url }}
by 👤 {{ comment.author }}
"""

_TELEGRAM_MIRROR = """\
{{ note.title }}
{% for field in note.fields %}
{{ field[0] }}: {{ field[1] }}
{% endfor %}\
"""

DEFAULT_TEMPLATES = {
    "note:title": "Note #{{ note.number }}",
    "telegram:activity_note_created": _TELEGRAM_NOTE_CREATED,
    "telegram:activity_note_updated": _TELEGRAM_NOTE_UPDATED,
    "telegram:activity_comment_created": _TELEGRAM_COMMENT_CREATED,
    "telegram:mirror": _TELEGRAM_MIRROR,
}

DEFAULT_TEMPLATES = {
    "note:title": "Note #{{ note.number }}",
    "telegram:activity_note_created": "📝 New note #{{ note.number }}\n{{ note.title }}\nby {{ note.author }}",
    "telegram:activity_note_updated": "✏️ Note #{{ note.number }} updated\n{{ note.title }}",
    "telegram:activity_comment_created": "💬 Comment on {{ note.title }}\n{{ comment.content }}\nby {{ comment.author }}",
}

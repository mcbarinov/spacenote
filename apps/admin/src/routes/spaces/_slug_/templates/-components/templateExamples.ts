export const LIQUID_NOTE_DETAIL_EXAMPLE = `<div class="note-detail">
  <h1>{{ note.title }}</h1>
  <p class="meta">👤{{ note.author }} · #{{ note.number }}</p>

  <div class="fields">
    {% for field in note.fields %}
      <div class="field">
        <span class="label">{{ field[0] }}:</span>
        <span class="value">{{ field[1] }}</span>
      </div>
    {% endfor %}
  </div>
</div>`

export const LIQUID_NOTE_LIST_EXAMPLE = `<div class="notes-list">
  <h2>{{ space.title }}</h2>
  <p>{{ notes.size }} notes</p>

  {% for note in notes %}
    <div class="note-item">
      <a href="/spaces/{{ space.slug }}/notes/{{ note.number }}">
        #{{ note.number }} - {{ note.title }}
      </a>
      <span class="author">👤{{ note.author }}</span>
    </div>
  {% endfor %}
</div>`

export const REACT_NOTE_DETAIL_EXAMPLE = `<Stack gap="md">
  <Title order={2}>{note.title}</Title>
  <Text size="sm" c="dimmed">👤{note.author} · #{note.number}</Text>

  <Divider />

  <Stack gap="xs">
    {Object.entries(note.fields).map(([key, value]) => (
      <Group key={key} gap="xs">
        <Badge variant="light">{key}</Badge>
        <Text>{String(value)}</Text>
      </Group>
    ))}
  </Stack>
</Stack>`

export const REACT_NOTE_LIST_EXAMPLE = `<Stack gap="md">
  <Title order={2}>{space.title}</Title>
  <Text c="dimmed">{notes.length} notes</Text>

  {notes.map((note) => (
    <Paper key={note.number} withBorder p="sm">
      <Group justify="space-between">
        <Group gap="xs">
          <Text fw={500}>#{note.number}</Text>
          <Text>{note.title}</Text>
        </Group>
        <Badge variant="light">👤{note.author}</Badge>
      </Group>
    </Paper>
  ))}
</Stack>`

import { Suspense, useEffect, useState } from "react"
import { Alert, Button, Code, Divider, Group, Loader, NumberInput, Paper, Stack, Text, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDebouncedValue } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import { renderTemplate, type NoteDetailContext } from "@spacenote/common/templates"

interface NoteTitleTemplateProps {
  spaceSlug: string
  currentContent: string
}

/** Editor for note.title template with live preview */
export function NoteTitleTemplate({ spaceSlug, currentContent }: NoteTitleTemplateProps) {
  const form = useForm({
    initialValues: { content: currentContent },
  })
  const setTemplateMutation = api.mutations.useSetTemplate(spaceSlug)

  const [noteNumber, setNoteNumber] = useState<number | null>(null)
  const [loadedNumber, setLoadedNumber] = useState<number | null>(null)
  const [debouncedContent] = useDebouncedValue(form.values.content, 400)

  const handleSubmit = form.onSubmit((values) => {
    setTemplateMutation.mutate(
      { key: "note:title", content: values.content },
      {
        onSuccess: () => {
          notifications.show({ message: "Template saved", color: "green" })
        },
      }
    )
  })

  return (
    <Stack gap="md">
      <Code>note:title</Code>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Textarea
            label="Template content"
            description="Liquid template for note title. Default: Note #{{ note.number }}"
            placeholder="Note #{{ note.number }}"
            {...form.getInputProps("content")}
            minRows={3}
            autosize
          />
          {setTemplateMutation.error && <ErrorMessage error={setTemplateMutation.error} />}
          <Group justify="flex-end">
            <Button type="submit" loading={setTemplateMutation.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>

      <Divider label="Preview" />

      <Group>
        <Text>Note number</Text>
        <NumberInput
          placeholder="latest"
          value={noteNumber ?? ""}
          onChange={(value) => {
            setNoteNumber(typeof value === "number" ? value : null)
          }}
          min={1}
          style={{ width: 100 }}
        />
        {loadedNumber !== null && <Text c="dimmed">#{loadedNumber}</Text>}
      </Group>

      <Suspense fallback={<Loader />}>
        {noteNumber === null ? (
          <LatestNoteTitlePreview spaceSlug={spaceSlug} template={debouncedContent} onNoteLoaded={setLoadedNumber} />
        ) : (
          <SpecificNoteTitlePreview
            spaceSlug={spaceSlug}
            template={debouncedContent}
            noteNumber={noteNumber}
            onNoteLoaded={setLoadedNumber}
          />
        )}
      </Suspense>
    </Stack>
  )
}

interface TitlePreviewProps {
  template: string
  context: NoteDetailContext
}

/** Renders title template as plain text */
function TitlePreview({ template, context }: TitlePreviewProps) {
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    void renderTemplate(template, context).then((result) => {
      if (!cancelled) {
        setTitle(result.html)
        setError(result.error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [template, context])

  if (error) {
    return <Alert color="red">{error}</Alert>
  }

  return (
    <Paper withBorder p="md">
      <Code>{title}</Code>
    </Paper>
  )
}

interface LatestNoteTitlePreviewProps {
  spaceSlug: string
  template: string
  onNoteLoaded: (num: number | null) => void
}

/** Preview that loads the latest note from list */
function LatestNoteTitlePreview({ spaceSlug, template, onNoteLoaded }: LatestNoteTitlePreviewProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(spaceSlug))

  useEffect(() => {
    onNoteLoaded(notesList.items[0]?.number ?? null)
  }, [notesList, onNoteLoaded])

  if (notesList.items.length === 0) {
    return <Alert color="yellow">No notes in this space yet</Alert>
  }

  const note = notesList.items[0]

  return <TitlePreview template={template} context={{ note, space }} />
}

interface SpecificNoteTitlePreviewProps {
  spaceSlug: string
  template: string
  noteNumber: number
  onNoteLoaded: (num: number | null) => void
}

/** Preview that loads a specific note by number */
function SpecificNoteTitlePreview({ spaceSlug, template, noteNumber, onNoteLoaded }: SpecificNoteTitlePreviewProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(spaceSlug, noteNumber))

  useEffect(() => {
    onNoteLoaded(note.number)
  }, [note, onNoteLoaded])

  return <TitlePreview template={template} context={{ note, space }} />
}

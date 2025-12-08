import { Suspense, useState, useEffect } from "react"
import { Stack, Group, Text, NumberInput, Loader, Alert, Button, Divider, Paper, Code, Anchor } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useSuspenseQuery } from "@tanstack/react-query"
import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import { mantineScope } from "./playgroundScope"
import { TemplateExampleModal } from "./TemplateExampleModal"
import { REACT_NOTE_DETAIL_EXAMPLE } from "./templateExamples"

interface NoteDetailReactTemplateProps {
  spaceSlug: string
  currentContent: string
}

/** React template editor for note detail with live preview */
export function NoteDetailReactTemplate({ spaceSlug, currentContent }: NoteDetailReactTemplateProps) {
  const [exampleOpened, { open: openExample, close: closeExample }] = useDisclosure(false)
  const [noteNumber, setNoteNumber] = useState<number | null>(null)
  const [loadedNumber, setLoadedNumber] = useState<number | null>(null)

  const form = useForm({
    initialValues: { content: currentContent },
  })
  const setTemplateMutation = api.mutations.useSetTemplate(spaceSlug)

  const handleSubmit = form.onSubmit((values) => {
    setTemplateMutation.mutate(
      { key: "web_react:note:detail", content: values.content },
      {
        onSuccess: () => {
          notifications.show({ message: "Template saved", color: "green" })
        },
      }
    )
  })

  return (
    <Stack gap="md">
      <Group>
        <Code>web_react:note:detail</Code>
        <Anchor size="sm" onClick={openExample}>
          Example
        </Anchor>
      </Group>
      <TemplateExampleModal
        opened={exampleOpened}
        onClose={closeExample}
        title="React Note Detail Example"
        example={REACT_NOTE_DETAIL_EXAMPLE}
      />
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
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
              <LatestNoteEditor
                spaceSlug={spaceSlug}
                code={form.values.content}
                onChange={(code) => {
                  form.setFieldValue("content", code)
                }}
                onNoteLoaded={setLoadedNumber}
              />
            ) : (
              <SpecificNoteEditor
                spaceSlug={spaceSlug}
                noteNumber={noteNumber}
                code={form.values.content}
                onChange={(code) => {
                  form.setFieldValue("content", code)
                }}
                onNoteLoaded={setLoadedNumber}
              />
            )}
          </Suspense>

          {setTemplateMutation.error && <ErrorMessage error={setTemplateMutation.error} />}
          <Group justify="flex-end">
            <Button type="submit" loading={setTemplateMutation.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}

interface LatestNoteEditorProps {
  spaceSlug: string
  code: string
  onChange: (code: string) => void
  onNoteLoaded: (num: number | null) => void
}

/** Editor that loads the latest note from list */
function LatestNoteEditor({ spaceSlug, code, onChange, onNoteLoaded }: LatestNoteEditorProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(spaceSlug))

  useEffect(() => {
    onNoteLoaded(notesList.items[0]?.number ?? null)
  }, [notesList, onNoteLoaded])

  if (notesList.items.length === 0) {
    return <Alert color="yellow">No notes in this space yet</Alert>
  }

  const note = notesList.items[0]
  const scope = { ...mantineScope, space, note }

  return <ReactEditor code={code} scope={scope} onChange={onChange} />
}

interface SpecificNoteEditorProps {
  spaceSlug: string
  noteNumber: number
  code: string
  onChange: (code: string) => void
  onNoteLoaded: (num: number | null) => void
}

/** Editor that loads a specific note by number */
function SpecificNoteEditor({ spaceSlug, noteNumber, code, onChange, onNoteLoaded }: SpecificNoteEditorProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(spaceSlug, noteNumber))

  useEffect(() => {
    onNoteLoaded(note.number)
  }, [note, onNoteLoaded])

  const scope = { ...mantineScope, space, note }

  return <ReactEditor code={code} scope={scope} onChange={onChange} />
}

interface ReactEditorProps {
  code: string
  scope: Record<string, unknown>
  onChange: (code: string) => void
}

/** Live React editor with preview */
function ReactEditor({ code, scope, onChange }: ReactEditorProps) {
  return (
    <LiveProvider code={code} scope={scope}>
      <Stack gap="md">
        <Paper withBorder p="md">
          <LiveEditor style={{ fontFamily: "monospace", fontSize: 14 }} onChange={onChange} />
        </Paper>
        <Divider label="Preview" />
        <Paper withBorder p="md">
          <LiveError />
          <LivePreview />
        </Paper>
      </Stack>
    </LiveProvider>
  )
}

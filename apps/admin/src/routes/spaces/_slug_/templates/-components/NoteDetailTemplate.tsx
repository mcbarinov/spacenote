import { Suspense, useEffect, useState } from "react"
import { Alert, Anchor, Button, Code, Divider, Group, Loader, NumberInput, Stack, Text, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure, useDebouncedValue } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import { TemplateExampleModal } from "./TemplateExampleModal"
import { LIQUID_NOTE_DETAIL_EXAMPLE } from "./templateExamples"
import { TemplatePreview } from "./TemplatePreview"

interface NoteDetailTemplateProps {
  spaceSlug: string
  currentContent: string
}

/** Editor for web:note:detail template with live preview */
export function NoteDetailTemplate({ spaceSlug, currentContent }: NoteDetailTemplateProps) {
  const [exampleOpened, { open: openExample, close: closeExample }] = useDisclosure(false)
  const form = useForm({
    initialValues: { content: currentContent },
  })
  const setTemplateMutation = api.mutations.useSetTemplate(spaceSlug)

  const [noteNumber, setNoteNumber] = useState<number | null>(null)
  const [loadedNumber, setLoadedNumber] = useState<number | null>(null)
  const [debouncedContent] = useDebouncedValue(form.values.content, 400)

  const handleSubmit = form.onSubmit((values) => {
    setTemplateMutation.mutate(
      { key: "web:note:detail", content: values.content },
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
        <Code>web:note:detail</Code>
        <Anchor size="sm" onClick={openExample}>
          Example
        </Anchor>
      </Group>
      <TemplateExampleModal
        opened={exampleOpened}
        onClose={closeExample}
        title="Liquid Note Detail Example"
        example={LIQUID_NOTE_DETAIL_EXAMPLE}
      />
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Textarea
            label="Template content"
            description="Liquid template for note detail page"
            {...form.getInputProps("content")}
            minRows={10}
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
          <LatestNotePreview spaceSlug={spaceSlug} template={debouncedContent} onNoteLoaded={setLoadedNumber} />
        ) : (
          <SpecificNotePreview
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

interface LatestNotePreviewProps {
  spaceSlug: string
  template: string
  onNoteLoaded: (num: number | null) => void
}

/** Preview that loads the latest note from list */
function LatestNotePreview({ spaceSlug, template, onNoteLoaded }: LatestNotePreviewProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(spaceSlug))

  useEffect(() => {
    onNoteLoaded(notesList.items[0]?.number ?? null)
  }, [notesList, onNoteLoaded])

  if (notesList.items.length === 0) {
    return <Alert color="yellow">No notes in this space yet</Alert>
  }

  const note = notesList.items[0]

  return <TemplatePreview template={template} context={{ note, space }} />
}

interface SpecificNotePreviewProps {
  spaceSlug: string
  template: string
  noteNumber: number
  onNoteLoaded: (num: number | null) => void
}

/** Preview that loads a specific note by number */
function SpecificNotePreview({ spaceSlug, template, noteNumber, onNoteLoaded }: SpecificNotePreviewProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(spaceSlug, noteNumber))

  useEffect(() => {
    onNoteLoaded(note.number)
  }, [note, onNoteLoaded])

  return <TemplatePreview template={template} context={{ note, space }} />
}

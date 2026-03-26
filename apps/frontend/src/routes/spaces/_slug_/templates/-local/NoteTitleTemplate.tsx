import { useEffect, useState } from "react"
import { Alert, Button, Code, Divider, Group, Paper, Stack, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDebouncedValue } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import { renderTemplate, type NoteDetailContext } from "@/templates"
import { NotePickerPreview } from "./NotePickerPreview"

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

      <NotePickerPreview spaceSlug={spaceSlug}>
        {(note, space) => <TitlePreview template={debouncedContent} context={{ note, space }} />}
      </NotePickerPreview>
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

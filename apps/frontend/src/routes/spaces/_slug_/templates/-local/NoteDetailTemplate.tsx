import { Stack, Group, Button, Code, Divider, Anchor, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure, useDebouncedValue } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import { TemplateExampleModal } from "./TemplateExampleModal"
import { LIQUID_NOTE_DETAIL_EXAMPLE } from "./templateExamples"
import { TemplatePreview } from "./TemplatePreview"
import { NotePickerPreview } from "./NotePickerPreview"

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

      <NotePickerPreview spaceSlug={spaceSlug}>
        {(note, space) => <TemplatePreview template={debouncedContent} context={{ note, space }} />}
      </NotePickerPreview>
    </Stack>
  )
}

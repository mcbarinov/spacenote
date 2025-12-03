import { Button, Group, Stack, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"

interface NoteDetailTemplateEditorProps {
  spaceSlug: string
  currentContent: string
}

/** Editor for web:note:detail template */
export function NoteDetailTemplateEditor({ spaceSlug, currentContent }: NoteDetailTemplateEditorProps) {
  const form = useForm({
    initialValues: { content: currentContent },
  })
  const setTemplateMutation = api.mutations.useSetTemplate(spaceSlug)

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
  )
}

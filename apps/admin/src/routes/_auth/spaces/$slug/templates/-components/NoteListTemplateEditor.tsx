import { Button, Group, Select, Stack, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"

interface NoteListTemplateEditorProps {
  spaceSlug: string
  filters: string[]
  templates: Record<string, string>
}

/** Editor for web:note:list:{filter} templates */
export function NoteListTemplateEditor({ spaceSlug, filters, templates }: NoteListTemplateEditorProps) {
  const form = useForm({
    initialValues: {
      filter: filters[0],
      content: templates[`web:note:list:${filters[0]}`] ?? "",
    },
  })
  const setTemplateMutation = api.mutations.useSetTemplate(spaceSlug)

  const handleFilterChange = (value: string | null) => {
    if (!value) return
    form.setFieldValue("filter", value)
    form.setFieldValue("content", templates[`web:note:list:${value}`] ?? "")
  }

  const handleSubmit = form.onSubmit((values) => {
    setTemplateMutation.mutate(
      { key: `web:note:list:${values.filter}`, content: values.content },
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
        <Select
          label="Filter"
          description="Select filter to edit its template"
          data={filters}
          {...form.getInputProps("filter")}
          onChange={handleFilterChange}
        />
        <Textarea
          label="Template content"
          description="Liquid template for note list page"
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

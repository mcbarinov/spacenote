import { Suspense, useEffect, useState } from "react"
import { Alert, Button, Divider, Group, Loader, Paper, Select, Stack, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDebouncedValue } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import { renderTemplate } from "@spacenote/common/templates"
import "@spacenote/common/styles/templates.css"

interface NoteListTemplateEditorProps {
  spaceSlug: string
  filters: string[]
  templates: Record<string, string>
}

/** Editor for web:note:list:{filter} templates with live preview */
export function NoteListTemplateEditor({ spaceSlug, filters, templates }: NoteListTemplateEditorProps) {
  const form = useForm({
    initialValues: {
      filter: filters[0],
      content: templates[`web:note:list:${filters[0]}`] ?? "",
    },
  })
  const setTemplateMutation = api.mutations.useSetTemplate(spaceSlug)
  const [debouncedContent] = useDebouncedValue(form.values.content, 400)

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
    <Stack gap="md">
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

      <Divider label="Preview" />

      <Suspense fallback={<Loader />}>
        <ListTemplatePreview spaceSlug={spaceSlug} template={debouncedContent} filter={form.values.filter} />
      </Suspense>
    </Stack>
  )
}

interface ListTemplatePreviewProps {
  spaceSlug: string
  template: string
  filter: string
}

/** Preview that loads notes by filter and renders template */
function ListTemplatePreview({ spaceSlug, template, filter }: ListTemplatePreviewProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(spaceSlug, filter))

  const [html, setHtml] = useState("")
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    void renderTemplate(template, { notes: notesList.items, space }).then((result) => {
      if (!cancelled) {
        setHtml(result.html)
        setError(result.error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [template, notesList.items, space])

  if (error) {
    return <Alert color="red">{error}</Alert>
  }

  if (!html) {
    return null
  }

  return (
    <Paper withBorder p="md">
      {/* Safe: output is sanitized by rehype-sanitize in renderTemplate */}
      {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Paper>
  )
}

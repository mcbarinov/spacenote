import { type ReactNode, Suspense } from "react"
import { Stack, Group, Select, Loader, Alert, Button, Code, Anchor } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import { mantineScope } from "./playgroundScope"
import { ReactEditor } from "./ReactEditor"
import { TemplateExampleModal } from "./TemplateExampleModal"
import { REACT_NOTE_LIST_EXAMPLE } from "./templateExamples"

interface NoteListReactTemplateProps {
  spaceSlug: string
  filters: string[]
  templates: Record<string, string>
}

/** React template editor for note list with live preview */
export function NoteListReactTemplate({ spaceSlug, filters, templates }: NoteListReactTemplateProps) {
  const [exampleOpened, { open: openExample, close: closeExample }] = useDisclosure(false)
  const form = useForm({
    initialValues: {
      filter: filters[0] ?? "",
      content: templates[`web_react:note:list:${filters[0]}`] ?? "",
    },
  })
  const setTemplateMutation = api.mutations.useSetTemplate(spaceSlug)

  const handleFilterChange = (value: string | null) => {
    if (!value) return
    form.setFieldValue("filter", value)
    form.setFieldValue("content", templates[`web_react:note:list:${value}`] ?? "")
  }

  const handleSubmit = form.onSubmit((values) => {
    setTemplateMutation.mutate(
      { key: `web_react:note:list:${values.filter}`, content: values.content },
      {
        onSuccess: () => {
          notifications.show({ message: "Template saved", color: "green" })
        },
      }
    )
  })

  if (filters.length === 0) {
    return <Alert color="yellow">No filters defined for this space</Alert>
  }

  return (
    <Stack gap="md">
      <Group>
        <Code>web_react:note:list:{form.values.filter}</Code>
        <Anchor size="sm" onClick={openExample}>
          Example
        </Anchor>
      </Group>
      <TemplateExampleModal
        opened={exampleOpened}
        onClose={closeExample}
        title="React Note List Example"
        example={REACT_NOTE_LIST_EXAMPLE}
      />
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Select
            label="Filter"
            description="Select filter to edit its template"
            data={filters}
            {...form.getInputProps("filter")}
            onChange={handleFilterChange}
          />

          {form.values.filter && (
            <Suspense fallback={<Loader />}>
              <ListEditor
                spaceSlug={spaceSlug}
                filter={form.values.filter}
                code={form.values.content}
                onChange={(code) => {
                  form.setFieldValue("content", code)
                }}
                actions={
                  <>
                    {setTemplateMutation.error && <ErrorMessage error={setTemplateMutation.error} />}
                    <Group justify="flex-end">
                      <Button type="submit" loading={setTemplateMutation.isPending}>
                        Save
                      </Button>
                    </Group>
                  </>
                }
              />
            </Suspense>
          )}
        </Stack>
      </form>
    </Stack>
  )
}

interface ListEditorProps {
  spaceSlug: string
  filter: string
  code: string
  onChange: (code: string) => void
  actions?: ReactNode
}

/** Editor that loads notes by filter */
function ListEditor({ spaceSlug, filter, code, onChange, actions }: ListEditorProps) {
  const space = api.cache.useSpace(spaceSlug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(spaceSlug, filter))

  const notes = notesList.items
  const scope = { ...mantineScope, space, notes }

  return <ReactEditor code={code} scope={scope} onChange={onChange} actions={actions} />
}

import { Stack, Group, Button, Code, Anchor } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import { mantineScope } from "./playgroundScope"
import { ReactEditor } from "./ReactEditor"
import { TemplateExampleModal } from "./TemplateExampleModal"
import { REACT_NOTE_DETAIL_EXAMPLE } from "./templateExamples"
import { NotePickerPreview } from "./NotePickerPreview"

interface NoteDetailReactTemplateProps {
  spaceSlug: string
  currentContent: string
}

/** React template editor for note detail with live preview */
export function NoteDetailReactTemplate({ spaceSlug, currentContent }: NoteDetailReactTemplateProps) {
  const [exampleOpened, { open: openExample, close: closeExample }] = useDisclosure(false)

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
          <NotePickerPreview spaceSlug={spaceSlug}>
            {(note, space) => (
              <ReactEditor
                code={form.values.content}
                scope={{ ...mantineScope, space, note }}
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
            )}
          </NotePickerPreview>
        </Stack>
      </form>
    </Stack>
  )
}

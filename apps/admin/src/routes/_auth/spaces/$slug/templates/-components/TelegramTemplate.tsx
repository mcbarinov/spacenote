import { Button, Code, Group, Select, Stack, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"

const TELEGRAM_TEMPLATE_KEYS = [
  "telegram:activity_note_created",
  "telegram:activity_note_updated",
  "telegram:activity_comment_created",
  "telegram:mirror",
]

interface TelegramTemplateProps {
  spaceSlug: string
  templates: Record<string, string>
}

/** Editor for telegram:* templates with select and textarea */
export function TelegramTemplate({ spaceSlug, templates }: TelegramTemplateProps) {
  const form = useForm({
    initialValues: {
      key: TELEGRAM_TEMPLATE_KEYS[0],
      content: templates[TELEGRAM_TEMPLATE_KEYS[0]] ?? "",
    },
  })
  const setTemplateMutation = api.mutations.useSetTemplate(spaceSlug)

  const handleKeyChange = (value: string | null) => {
    if (!value) return
    form.setFieldValue("key", value)
    form.setFieldValue("content", templates[value] ?? "")
  }

  const handleSubmit = form.onSubmit((values) => {
    setTemplateMutation.mutate(
      { key: values.key, content: values.content },
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
        <Group>
          <Code>{form.values.key}</Code>
        </Group>
        <Select
          label="Template"
          description="Select template to edit"
          data={[...TELEGRAM_TEMPLATE_KEYS]}
          {...form.getInputProps("key")}
          onChange={handleKeyChange}
        />
        <Textarea
          label="Template content"
          description="Liquid template for Telegram message"
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

import { Button, Group, MultiSelect, Paper, Stack, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface EditEditableFieldsOnCommentProps {
  space: Space
}

/** Form to configure which fields can be edited when adding a comment */
export function EditEditableFieldsOnComment({ space }: EditEditableFieldsOnCommentProps) {
  const updateMutation = api.mutations.useUpdateSpaceEditableFieldsOnComment(space.slug)

  const form = useForm({
    initialValues: { editable_fields_on_comment: space.editable_fields_on_comment },
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "Editable fields updated", color: "green" })
      },
    })
  })

  // Exclude image fields - not supported in comment form
  const fieldOptions = space.fields.filter((f) => f.type !== "image").map((f) => f.name)

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Editable Fields on Comment</Title>
          <MultiSelect
            data={fieldOptions}
            placeholder="Select fields that can be edited when adding a comment"
            searchable
            {...form.getInputProps("editable_fields_on_comment")}
          />
          {updateMutation.error && <ErrorMessage error={updateMutation.error} />}
          <Group justify="flex-end">
            <Button type="submit" loading={updateMutation.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}

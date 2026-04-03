import { Badge, Button, Group, MultiSelect, Paper, Stack, Text, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import type { Space } from "@/types"
import { getInheritedEditableFieldsOnComment, useParentSpace } from "@/routes/spaces/-shared/inheritance"

interface EditEditableFieldsOnCommentProps {
  space: Space
}

/** Form to configure which fields can be edited when adding a comment */
export function EditEditableFieldsOnComment({ space }: EditEditableFieldsOnCommentProps) {
  const updateMutation = api.mutations.useUpdateSpaceEditableFieldsOnComment(space.slug)
  const parentSpace = useParentSpace(space)
  const inheritedNames = parentSpace ? getInheritedEditableFieldsOnComment(parentSpace) : new Set<string>()

  // Own items = resolved list minus inherited
  const ownItems = space.editable_fields_on_comment.filter((f) => !inheritedNames.has(f))

  const form = useForm({
    initialValues: { editable_fields_on_comment: ownItems },
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "Editable fields updated", color: "green" })
      },
    })
  })

  // Exclude image fields and already inherited fields
  const fieldOptions = space.fields
    .filter((f) => f.type !== "image")
    .filter((f) => !inheritedNames.has(f.name))
    .map((f) => f.name)

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Editable Fields on Comment</Title>
          {inheritedNames.size > 0 && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Inherited from parent:
              </Text>
              {[...inheritedNames].map((name) => (
                <Badge key={name} size="sm" variant="light" color="gray">
                  {name}
                </Badge>
              ))}
            </Group>
          )}
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

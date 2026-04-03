import { Badge, Button, Group, MultiSelect, Paper, Stack, Text, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import type { Space } from "@/types"
import { getInheritedHiddenFieldsOnCreate, useParentSpace } from "@/routes/spaces/-shared/inheritance"

interface EditHiddenFieldsOnCreateProps {
  space: Space
}

/** Form to configure which fields are hidden when creating notes */
export function EditHiddenFieldsOnCreate({ space }: EditHiddenFieldsOnCreateProps) {
  const updateMutation = api.mutations.useUpdateSpaceHiddenFieldsOnCreate(space.slug)
  const parentSpace = useParentSpace(space)
  const inheritedNames = parentSpace ? getInheritedHiddenFieldsOnCreate(parentSpace) : new Set<string>()

  // Own items = resolved list minus inherited
  const ownItems = space.hidden_fields_on_create.filter((f) => !inheritedNames.has(f))

  const form = useForm({
    initialValues: { hidden_fields_on_create: ownItems },
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "Hidden fields updated", color: "green" })
      },
    })
  })

  // Only optional fields or fields with defaults can be hidden; exclude already inherited
  const fieldOptions = space.fields
    .filter((f) => !f.required || f.default !== null)
    .filter((f) => !inheritedNames.has(f.name))
    .map((f) => f.name)

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Hidden Fields on Create</Title>
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
            placeholder="Select fields to hide when creating notes"
            searchable
            {...form.getInputProps("hidden_fields_on_create")}
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

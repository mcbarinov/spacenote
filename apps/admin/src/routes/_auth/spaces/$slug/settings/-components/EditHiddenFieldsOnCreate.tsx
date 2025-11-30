import { Button, Group, MultiSelect, Paper, Stack, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface EditHiddenFieldsOnCreateProps {
  space: Space
}

export function EditHiddenFieldsOnCreate({ space }: EditHiddenFieldsOnCreateProps) {
  const updateMutation = api.mutations.useUpdateSpaceHiddenFieldsOnCreate(space.slug)

  const form = useForm({
    initialValues: { hidden_fields_on_create: space.hidden_fields_on_create },
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "Hidden fields updated", color: "green" })
      },
    })
  })

  const fieldOptions = space.fields.map((f) => f.name)

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Hidden Fields on Create</Title>
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

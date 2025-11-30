import { Button, Group, MultiSelect, Paper, Stack, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface EditNotesListDefaultColumnsProps {
  space: Space
}

export function EditNotesListDefaultColumns({ space }: EditNotesListDefaultColumnsProps) {
  const updateMutation = api.mutations.useUpdateSpaceNotesListDefaultColumns(space.slug)

  const form = useForm({
    initialValues: { notes_list_default_columns: space.notes_list_default_columns },
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "Default columns updated", color: "green" })
      },
    })
  })

  const fieldOptions = space.fields.map((f) => f.name)

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Notes List Default Columns</Title>
          <MultiSelect
            data={fieldOptions}
            placeholder="Select default columns for notes list"
            searchable
            {...form.getInputProps("notes_list_default_columns")}
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

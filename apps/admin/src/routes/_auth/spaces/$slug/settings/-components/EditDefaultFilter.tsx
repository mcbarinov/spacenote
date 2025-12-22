import { Button, Group, Paper, Select, Stack, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface EditDefaultFilterProps {
  space: Space
}

/** Form to configure the default filter for the space */
export function EditDefaultFilter({ space }: EditDefaultFilterProps) {
  const updateMutation = api.mutations.useUpdateSpaceDefaultFilter(space.slug)

  const form = useForm({
    initialValues: { default_filter: space.default_filter },
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "Default filter updated", color: "green" })
      },
    })
  })

  const filterOptions = space.filters.map((f) => f.name)

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Default Filter</Title>
          <Select data={filterOptions} placeholder="Select default filter" {...form.getInputProps("default_filter")} />
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

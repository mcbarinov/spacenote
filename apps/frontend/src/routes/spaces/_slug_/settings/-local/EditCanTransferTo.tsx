import { Button, Group, MultiSelect, Paper, Stack, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import type { Space } from "@/types"

interface EditCanTransferToProps {
  space: Space
}

/** Form to configure which spaces notes can be transferred to */
export function EditCanTransferTo({ space }: EditCanTransferToProps) {
  const updateMutation = api.mutations.useUpdateSpaceCanTransferTo(space.slug)
  const spaces = api.cache.useSpaces()

  const form = useForm({
    initialValues: { can_transfer_to: space.can_transfer_to },
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "Transfer targets updated", color: "green" })
      },
    })
  })

  const spaceOptions = spaces.filter((s) => s.slug !== space.slug).map((s) => s.slug)

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Can Transfer To</Title>
          <MultiSelect
            data={spaceOptions}
            placeholder="Select spaces that notes can be transferred to"
            searchable
            {...form.getInputProps("can_transfer_to")}
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

import { Group, Paper, Stack, Text, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { api } from "@spacenote/common/api"
import { DeleteButton } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface DeleteSpaceProps {
  space: Space
}

/** Danger zone section with space delete button */
export function DeleteSpace({ space }: DeleteSpaceProps) {
  const navigate = useNavigate()
  const deleteMutation = api.mutations.useDeleteSpace()

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Title order={3}>Danger Zone</Title>
        <Text c="dimmed">Once you delete a space, there is no going back. Please be certain.</Text>
        <Group justify="flex-end">
          <DeleteButton
            title="Delete Space"
            message={`Are you sure you want to delete space "${space.title}"? This action cannot be undone.`}
            onConfirm={() => {
              deleteMutation.mutate(space.slug, {
                onSuccess: () => {
                  notifications.show({ message: "Space deleted", color: "green" })
                  void navigate({ to: "/spaces" })
                },
              })
            }}
          />
        </Group>
      </Stack>
    </Paper>
  )
}

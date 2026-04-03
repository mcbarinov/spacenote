import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { api } from "@/api"
import type { Space } from "@/types"
import { useChildSpaces } from "@/routes/spaces/-shared/inheritance"

interface DeleteSpaceProps {
  space: Space
}

/** Danger zone section with space delete button */
export function DeleteSpace({ space }: DeleteSpaceProps) {
  const navigate = useNavigate()
  const deleteMutation = api.mutations.useDeleteSpace()
  const children = useChildSpaces(space)
  const hasChildren = children.length > 0

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Title order={3}>Danger Zone</Title>
        {hasChildren ? (
          <Text c="dimmed">
            Cannot delete: this space is the parent of {children.map((c) => c.slug).join(", ")}. Delete the child spaces first.
          </Text>
        ) : (
          <Text c="dimmed">Once you delete a space, there is no going back. Please be certain.</Text>
        )}
        <Group justify="flex-end">
          <Button
            color="red"
            disabled={hasChildren}
            onClick={() => {
              modals.openConfirmModal({
                title: "Delete Space",
                children: `Are you sure you want to delete space "${space.title}"? This action cannot be undone.`,
                labels: { confirm: "Delete", cancel: "Cancel" },
                confirmProps: { color: "red" },
                onConfirm: () => {
                  deleteMutation.mutate(space.slug, {
                    onSuccess: () => {
                      notifications.show({ message: "Space deleted", color: "green" })
                      void navigate({ to: "/" })
                    },
                  })
                },
              })
            }}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

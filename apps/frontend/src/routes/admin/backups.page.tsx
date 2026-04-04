import { createFileRoute } from "@tanstack/react-router"
import { ActionIcon, Button, Paper, Stack, Table, Group, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconDownload, IconTrash } from "@tabler/icons-react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@/api"
import { AppError } from "@/errors/AppError"
import { PageHeader } from "@/components/PageHeader"
import { formatDate, formatFileSize } from "@/utils/format"

export const Route = createFileRoute("/_auth/_admin/admin/backups")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(api.queries.listBackups())
  },
  component: BackupsPage,
})

/** Admin page for creating and managing database backups */
function BackupsPage() {
  const { data: backups } = useSuspenseQuery(api.queries.listBackups())
  const createMutation = api.mutations.useCreateBackup()
  const deleteMutation = api.mutations.useDeleteBackup()

  return (
    <Stack gap="md">
      <PageHeader breadcrumbs={[{ label: "Backups" }]} />
      <Button
        loading={createMutation.isPending}
        onClick={() => {
          createMutation.mutate(undefined, {
            onSuccess: () => {
              notifications.show({ message: "Backup created", color: "green" })
            },
            onError: (error) => {
              notifications.show({ message: AppError.fromUnknown(error).message, color: "red" })
            },
          })
        }}
      >
        Create Backup
      </Button>
      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Filename</Table.Th>
              <Table.Th>Size</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th w={80}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {backups.map((backup) => (
              <Table.Tr key={backup.filename}>
                <Table.Td>{backup.filename}</Table.Td>
                <Table.Td>{formatFileSize(backup.size)}</Table.Td>
                <Table.Td>{formatDate(backup.created_at)}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Download">
                      <ActionIcon variant="subtle" component="a" href={`/api/v1/backups/${backup.filename}/download`}>
                        <IconDownload size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        loading={deleteMutation.isPending}
                        onClick={() => {
                          deleteMutation.mutate(backup.filename, {
                            onSuccess: () => {
                              notifications.show({ message: "Backup deleted", color: "green" })
                            },
                            onError: (error) => {
                              notifications.show({ message: AppError.fromUnknown(error).message, color: "red" })
                            },
                          })
                        }}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

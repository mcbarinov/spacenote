import { createFileRoute, Link } from "@tanstack/react-router"
import { Button, Group, Paper, Stack, Table } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { AppError } from "@/errors/AppError"
import { DeleteButton } from "@/components/DeleteButton"
import { PageHeader } from "@/components/PageHeader"
import { SetPasswordButton } from "./-local/SetPasswordButton"

export const Route = createFileRoute("/_auth/_admin/admin/users")({
  component: UsersPage,
})

/** Admin users list page */
function UsersPage() {
  const users = api.cache.useUsers()
  const deleteUserMutation = api.mutations.useDeleteUser()

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Users" }]}
        topActions={
          <Button component={Link} to="/admin/users/new">
            Create User
          </Button>
        }
      />
      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Username</Table.Th>
              <Table.Th w={100}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.username}>
                <Table.Td>{user.username}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <SetPasswordButton username={user.username} />
                    <DeleteButton
                      title="Delete User"
                      message={`Are you sure you want to delete user "${user.username}"?`}
                      onConfirm={() => {
                        deleteUserMutation.mutate(user.username, {
                          onSuccess: () => {
                            notifications.show({ message: "User deleted", color: "green" })
                          },
                          onError: (error) => {
                            notifications.show({ message: AppError.fromUnknown(error).message, color: "red" })
                          },
                        })
                      }}
                    />
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

import { createFileRoute, Link } from "@tanstack/react-router"
import { Button, Group, Stack, Table } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { DeleteButton, PageHeader, Username } from "@spacenote/common/components"
import { AppError } from "@spacenote/common/errors"
import { SetPasswordButton } from "./-components/SetPasswordButton"

export const Route = createFileRoute("/_auth.layout/users/")({
  component: UsersPage,
})

/** Users list page with create user button */
function UsersPage() {
  const users = api.cache.useUsers()
  const deleteUserMutation = api.mutations.useDeleteUser()

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ to: "/", label: "Admin Dashboard" }, { label: "Users" }]}
        topActions={
          <Button component={Link} to="/users/new">
            Create User
          </Button>
        }
      />
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
              <Table.Td>
                <Username username={user.username} />
              </Table.Td>
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
    </Stack>
  )
}

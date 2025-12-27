import { Group, Paper, Stack, Table, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { DeleteButton, Username } from "@spacenote/common/components"
import { AppError } from "@spacenote/common/errors"
import { CreateUserButton } from "./CreateUserButton"
import { SetPasswordButton } from "./SetPasswordButton"

/** Users section with list and create button */
export function UsersBlock() {
  const users = api.cache.useUsers()
  const deleteUserMutation = api.mutations.useDeleteUser()

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3}>Users</Title>
          <CreateUserButton />
        </Group>

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
    </Paper>
  )
}

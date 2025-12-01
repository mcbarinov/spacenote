import { Paper, Table } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { DeleteButton, Username } from "@spacenote/common/components"
import type { User } from "@spacenote/common/types"

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const deleteUserMutation = api.mutations.useDeleteUser()

  return (
    <Paper withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Username</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => (
            <Table.Tr key={user.username}>
              <Table.Td>
                <Username username={user.username} />
              </Table.Td>
              <Table.Td>
                <DeleteButton
                  title="Delete User"
                  message={`Are you sure you want to delete user "${user.username}"?`}
                  onConfirm={() => {
                    deleteUserMutation.mutate(user.username, {
                      onSuccess: () => {
                        notifications.show({
                          message: "User deleted successfully",
                          color: "green",
                        })
                      },
                    })
                  }}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

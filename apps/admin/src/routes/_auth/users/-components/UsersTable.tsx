import { Button, Paper, Table } from "@mantine/core"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import type { User } from "@spacenote/common/types"

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const deleteUserMutation = api.mutations.useDeleteUser()

  const handleDeleteClick = (username: string) => {
    modals.openConfirmModal({
      title: "Delete User",
      children: `Are you sure you want to delete user "${username}"?`,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteUserMutation.mutate(username, {
          onSuccess: () => {
            notifications.show({
              message: "User deleted successfully",
              color: "green",
            })
          },
        })
      },
    })
  }

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
              <Table.Td>{user.username}</Table.Td>
              <Table.Td>
                <Button
                  size="xs"
                  color="red"
                  onClick={() => {
                    handleDeleteClick(user.username)
                  }}
                >
                  Delete
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

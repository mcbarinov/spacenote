import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ActionIcon, Button, Checkbox, Group, Modal, Paper, PasswordInput, Stack, Table } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconKey } from "@tabler/icons-react"
import { api } from "@/api"
import { DeleteButton } from "@/components/DeleteButton"
import { ErrorMessage } from "@/components/ErrorMessage"
import { PageHeader } from "@/components/PageHeader"
import { AppError } from "@/errors/AppError"

export const Route = createFileRoute("/_auth/_admin/admin/users")({
  component: UsersPage,
})

/** Action icon with modal to set user password */
function SetPasswordButton({ username }: { username: string }) {
  const [opened, setOpened] = useState(false)
  const setPasswordMutation = api.mutations.useSetUserPassword()
  const form = useForm({ initialValues: { password: "" } })

  const handleSubmit = form.onSubmit((values) => {
    setPasswordMutation.mutate(
      { username, password: values.password },
      {
        onSuccess: () => {
          notifications.show({ message: "Password updated", color: "green" })
          setOpened(false)
          form.reset()
        },
      }
    )
  })

  return (
    <>
      <ActionIcon
        variant="subtle"
        onClick={() => {
          setOpened(true)
        }}
      >
        <IconKey size={18} />
      </ActionIcon>
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false)
        }}
        title={`Set password for "${username}"`}
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <PasswordInput label="New password" required {...form.getInputProps("password")} />
            {setPasswordMutation.error && <ErrorMessage error={setPasswordMutation.error} />}
            <Group justify="flex-end">
              <Button type="submit" loading={setPasswordMutation.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  )
}

/** Admin users list page */
function UsersPage() {
  const users = api.cache.useUsers()
  const deleteUserMutation = api.mutations.useDeleteUser()
  const setAdminMutation = api.mutations.useSetUserAdmin()

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
              <Table.Th>Admin</Table.Th>
              <Table.Th w={100}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.username}>
                <Table.Td>{user.username}</Table.Td>
                <Table.Td>
                  <Checkbox
                    checked={user.is_admin}
                    onChange={(e) => {
                      setAdminMutation.mutate(
                        { username: user.username, is_admin: e.currentTarget.checked },
                        {
                          onError: (error) => {
                            notifications.show({ message: AppError.fromUnknown(error).message, color: "red" })
                          },
                        }
                      )
                    }}
                  />
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
      </Paper>
    </Stack>
  )
}

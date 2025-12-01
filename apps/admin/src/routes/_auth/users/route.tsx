import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Button, Group, Stack, Title } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { UsersTable } from "./-components/UsersTable"
import { CreateUserModal } from "./-components/CreateUserModal"

export const Route = createFileRoute("/_auth/users")({
  component: UsersPage,
})

/** Users list page with create user button */
function UsersPage() {
  const users = api.cache.useUsers()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={1}>Users</Title>
        <Button
          onClick={() => {
            setIsCreateModalOpen(true)
          }}
        >
          Create User
        </Button>
      </Group>

      <UsersTable users={users} />

      <CreateUserModal
        opened={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
        }}
      />
    </Stack>
  )
}

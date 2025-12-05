import { createFileRoute, Link } from "@tanstack/react-router"
import { Button, Stack } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import { UsersTable } from "./-components/UsersTable"

export const Route = createFileRoute("/_auth/users/")({
  component: UsersPage,
})

/** Users list page */
function UsersPage() {
  const users = api.cache.useUsers()

  return (
    <Stack gap="md">
      <PageHeader
        title="Users"
        actions={
          <Button component={Link} to="/users/new">
            Create User
          </Button>
        }
      />
      <UsersTable users={users} />
    </Stack>
  )
}

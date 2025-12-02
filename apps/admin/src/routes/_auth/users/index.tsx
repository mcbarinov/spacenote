import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
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
      <PageHeader title="Users" nav={[{ label: "Create User", to: "/users/new" }]} />
      <UsersTable users={users} />
    </Stack>
  )
}

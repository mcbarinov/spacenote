import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { Button, MultiSelect, Paper, Stack } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import { SpaceHeader } from "@/components/SpaceHeader"

export const Route = createFileRoute("/_auth/spaces/$slug/members")({
  component: SpaceMembersPage,
})

function SpaceMembersPage() {
  const navigate = useNavigate()
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const users = api.cache.useUsers()
  const updateMembersMutation = api.mutations.useUpdateSpaceMembers(slug)

  const form = useForm({
    initialValues: {
      members: space.members,
    },
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMembersMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({
          message: "Members updated successfully",
          color: "green",
        })
        void navigate({ to: "/spaces" })
      },
    })
  })

  // Admins manage system, not content - they cannot be space members
  const userOptions = users.filter((user) => user.username !== "admin").map((user) => user.username)

  return (
    <Stack gap="md">
      <SpaceHeader space={space} title="Members" />

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <MultiSelect
              label="Members"
              placeholder="Select members"
              data={userOptions}
              searchable
              {...form.getInputProps("members")}
            />
            {updateMembersMutation.error && <ErrorMessage error={updateMembersMutation.error} />}
            <Button type="submit" loading={updateMembersMutation.isPending}>
              Save
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}

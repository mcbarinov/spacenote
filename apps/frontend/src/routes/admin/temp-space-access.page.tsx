import { createFileRoute } from "@tanstack/react-router"
import { ActionIcon, Paper, Stack, Table, Text, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconDoorEnter, IconDoorExit } from "@tabler/icons-react"
import { api } from "@/api"
import { AppError } from "@/errors/AppError"
import { PageHeader } from "@/components/PageHeader"
import type { Space } from "@/types"

export const Route = createFileRoute("/_auth/_admin/admin/temp-space-access")({
  component: AdminSpacesPage,
})

/** Admin page to join/leave spaces */
function AdminSpacesPage() {
  const currentUser = api.cache.useCurrentUser()
  const allSpaces = api.cache.useAllSpaces()
  const joinMutation = api.mutations.useAdminJoinSpace()
  const leaveMutation = api.mutations.useAdminLeaveSpace()

  return (
    <Stack gap="md">
      <PageHeader breadcrumbs={[{ label: "Temp Space Access" }]} />
      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Space</Table.Th>
              <Table.Th>Members</Table.Th>
              <Table.Th w={80}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {allSpaces.map((space) => {
              const isMember = space.members.some((m) => m.username === currentUser.username)
              const isPending = joinMutation.isPending || leaveMutation.isPending

              return (
                <Table.Tr key={space.slug}>
                  <Table.Td>{space.slug}</Table.Td>
                  <Table.Td>
                    <MembersList space={space} />
                  </Table.Td>
                  <Table.Td>
                    {isMember ? (
                      <Tooltip label="Leave space">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          loading={isPending}
                          onClick={() => {
                            leaveMutation.mutate(space.slug, {
                              onSuccess: () => {
                                notifications.show({ message: `Left space "${space.slug}"`, color: "green" })
                              },
                              onError: (error) => {
                                notifications.show({ message: AppError.fromUnknown(error).message, color: "red" })
                              },
                            })
                          }}
                        >
                          <IconDoorExit size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : (
                      <Tooltip label="Join space">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          loading={isPending}
                          onClick={() => {
                            joinMutation.mutate(space.slug, {
                              onSuccess: () => {
                                notifications.show({ message: `Joined space "${space.slug}"`, color: "green" })
                              },
                              onError: (error) => {
                                notifications.show({ message: AppError.fromUnknown(error).message, color: "red" })
                              },
                            })
                          }}
                        >
                          <IconDoorEnter size={18} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

/** Renders members as comma-separated list, highlighting space admins */
function MembersList({ space }: { space: Space }) {
  return (
    <Text size="sm">
      {space.members.map((m, i) => {
        const isSpaceAdmin = m.permissions.includes("all")
        return (
          <span key={m.username}>
            {i > 0 && ", "}
            <Text span fw={isSpaceAdmin ? 700 : undefined} c={isSpaceAdmin ? "blue" : undefined}>
              {m.username}
            </Text>
          </span>
        )
      })}
    </Text>
  )
}

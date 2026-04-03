import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { Button, Checkbox, Group, Paper, Select, Stack, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import type { components } from "@/types/openapi.gen"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { ErrorMessage } from "@/components/ErrorMessage"
import { DeleteButton } from "@/components/DeleteButton"
import { SpaceTabs } from "../-shared/SpaceTabs"

type Permission = components["schemas"]["Permission"]

const PERMISSIONS: Permission[] = ["all", "create_note", "create_comment"]

export const Route = createFileRoute("/_auth/_spaces/spaces/$slug/members")({
  component: SpaceMembersPage,
})

/** Form to manage space members and their permissions */
function SpaceMembersPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const users = api.cache.useUsers()
  const currentUser = api.cache.useCurrentUser()
  const updateMembersMutation = api.mutations.useUpdateSpaceMembers(slug)

  const form = useForm({
    initialValues: {
      members: space.members.map((m) => ({ username: m.username, permissions: [...m.permissions] })),
    },
  })

  const [newMember, setNewMember] = useState<string | null>(null)

  const memberUsernames = new Set(form.getValues().members.map((m) => m.username))
  const availableUsers = users.filter((u) => !memberUsernames.has(u.username)).map((u) => u.username)

  const handleAdd = () => {
    if (!newMember) return
    form.insertListItem("members", { username: newMember, permissions: [] as Permission[] })
    setNewMember(null)
  }

  const handleTogglePermission = (index: number, permission: Permission) => {
    const member: { username: string; permissions: Permission[] } = form.getValues().members[index]
    const has = member.permissions.includes(permission)
    if (has) {
      form.setFieldValue(
        `members.${index}.permissions`,
        member.permissions.filter((p) => p !== permission)
      )
    } else {
      form.setFieldValue(`members.${index}.permissions`, [...member.permissions, permission])
    }
  }

  const handleSubmit = form.onSubmit((values) => {
    updateMembersMutation.mutate(
      { members: values.members.map((m) => ({ username: m.username, permissions: m.permissions })) },
      {
        onSuccess: () => {
          notifications.show({ message: "Members updated", color: "green" })
        },
      }
    )
  })

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces", to: "/" }, { label: `◈ ${space.slug}` }, { label: "Members" }]}
        topActions={<SpaceTabs space={space} />}
      />

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Username</Table.Th>
                  {PERMISSIONS.map((p) => (
                    <Table.Th key={p} w={120}>
                      {p}
                    </Table.Th>
                  ))}
                  <Table.Th w={60} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {form.getValues().members.map((member, index) => {
                  const isCurrentUser = member.username === currentUser.username
                  const hasAll = member.permissions.includes("all")

                  return (
                    <Table.Tr key={member.username}>
                      <Table.Td>
                        {member.username}
                        {isCurrentUser && (
                          <Text span c="dimmed" size="sm">
                            {" "}
                            (you)
                          </Text>
                        )}
                      </Table.Td>
                      {PERMISSIONS.map((p) => (
                        <Table.Td key={p}>
                          <Checkbox
                            checked={member.permissions.includes(p)}
                            disabled={isCurrentUser || (p !== "all" && hasAll)}
                            onChange={() => {
                              handleTogglePermission(index, p)
                            }}
                          />
                        </Table.Td>
                      ))}
                      <Table.Td>
                        {!isCurrentUser && (
                          <DeleteButton
                            title="Remove member"
                            message={`Remove "${member.username}" from this space?`}
                            onConfirm={() => {
                              form.removeListItem("members", index)
                            }}
                          />
                        )}
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
                {form.getValues().members.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={PERMISSIONS.length + 2}>
                      <Text c="dimmed" ta="center">
                        No members
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>

            <Group>
              <Select
                placeholder="Add member"
                data={availableUsers}
                value={newMember}
                onChange={setNewMember}
                searchable
                clearable
              />
              <Button variant="light" onClick={handleAdd} disabled={!newMember}>
                Add
              </Button>
            </Group>

            {updateMembersMutation.error && <ErrorMessage error={updateMembersMutation.error} />}

            <Group justify="flex-end">
              <Button type="submit" loading={updateMembersMutation.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}

import { Button, Paper, Table } from "@mantine/core"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { CustomLink } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface SpacesTableProps {
  spaces: Space[]
}

export function SpacesTable({ spaces }: SpacesTableProps) {
  const deleteSpaceMutation = api.mutations.useDeleteSpace()

  const handleDeleteClick = (slug: string, title: string) => {
    modals.openConfirmModal({
      title: "Delete Space",
      children: `Are you sure you want to delete space "${title}"?`,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteSpaceMutation.mutate(slug, {
          onSuccess: () => {
            notifications.show({
              message: "Space deleted successfully",
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
            <Table.Th>Slug</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Members</Table.Th>
            <Table.Th>Fields</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {spaces.map((space) => (
            <Table.Tr key={space.slug}>
              <Table.Td>{space.slug}</Table.Td>
              <Table.Td>{space.title}</Table.Td>
              <Table.Td>
                {space.description.length > 100 ? `${space.description.slice(0, 100)}...` : space.description || "-"}
              </Table.Td>
              <Table.Td>{space.members.join(", ") || "-"}</Table.Td>
              <Table.Td>
                <CustomLink to="/spaces/$slug/fields" params={{ slug: space.slug }}>
                  {space.fields.length} fields
                </CustomLink>
              </Table.Td>
              <Table.Td>
                <Button
                  size="xs"
                  color="red"
                  onClick={() => {
                    handleDeleteClick(space.slug, space.title)
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

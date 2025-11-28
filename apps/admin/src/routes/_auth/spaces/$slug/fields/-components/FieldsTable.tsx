import { Badge, Code, Paper, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { DeleteButton } from "@spacenote/common/components"
import type { SpaceField } from "@spacenote/common/types"

interface FieldsTableProps {
  spaceSlug: string
  fields: SpaceField[]
}

export function FieldsTable({ spaceSlug, fields }: FieldsTableProps) {
  const deleteFieldMutation = api.mutations.useDeleteField(spaceSlug)

  if (fields.length === 0) {
    return (
      <Paper withBorder p="md">
        <Text c="dimmed">No fields defined yet</Text>
      </Paper>
    )
  }

  return (
    <Paper withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Required</Table.Th>
            <Table.Th>Options</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fields.map((field) => (
            <Table.Tr key={field.name}>
              <Table.Td>{field.name}</Table.Td>
              <Table.Td>
                <Badge variant="light">{field.type}</Badge>
              </Table.Td>
              <Table.Td>{field.required ? "Yes" : "No"}</Table.Td>
              <Table.Td>
                <Code>{field.options ? JSON.stringify(field.options) : "-"}</Code>
              </Table.Td>
              <Table.Td>
                <DeleteButton
                  title="Delete Field"
                  message={`Are you sure you want to delete field "${field.name}"?`}
                  onConfirm={() => {
                    deleteFieldMutation.mutate(field.name, {
                      onSuccess: () => {
                        notifications.show({
                          message: "Field deleted successfully",
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

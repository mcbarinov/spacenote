import { ActionIcon, Code, Group, Paper, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { Link } from "@tanstack/react-router"
import { IconPencil } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import { DeleteButton, TextBadge } from "@spacenote/common/components"
import type { SpaceField } from "@spacenote/common/types"

interface FieldsTableProps {
  spaceSlug: string
  fields: SpaceField[]
}

/** Table displaying space fields with delete action */
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
            <Table.Th>Default</Table.Th>
            <Table.Th>Options</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fields.map((field) => (
            <Table.Tr key={field.name}>
              <Table.Td>{field.name}</Table.Td>
              <Table.Td>
                <TextBadge variant="light">{field.type}</TextBadge>
              </Table.Td>
              <Table.Td>{field.required ? "Yes" : "No"}</Table.Td>
              <Table.Td>
                <Code>{field.default !== null ? JSON.stringify(field.default) : "-"}</Code>
              </Table.Td>
              <Table.Td>
                <Code>{Object.keys(field.options).length > 0 ? JSON.stringify(field.options) : "-"}</Code>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Link to="/spaces/$slug/fields/$fieldName/edit" params={{ slug: spaceSlug, fieldName: field.name }}>
                    <ActionIcon variant="subtle">
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Link>
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
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

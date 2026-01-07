import { ActionIcon, Code, Group, Paper, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { Link } from "@tanstack/react-router"
import { IconPencil } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import { DeleteButton } from "@spacenote/common/components"
import type { Filter } from "@spacenote/common/types"

interface FiltersTableProps {
  spaceSlug: string
  filters: Filter[]
}

/** Table displaying space filters with delete action */
export function FiltersTable({ spaceSlug, filters }: FiltersTableProps) {
  const deleteFilterMutation = api.mutations.useDeleteFilter(spaceSlug)

  if (filters.length === 0) {
    return (
      <Paper withBorder p="md">
        <Text c="dimmed">No filters defined yet</Text>
      </Paper>
    )
  }

  return (
    <Paper withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Default Columns</Table.Th>
            <Table.Th>Conditions</Table.Th>
            <Table.Th>Sort</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filters.map((filter) => (
            <Table.Tr key={filter.name}>
              <Table.Td>{filter.name}</Table.Td>
              <Table.Td>
                <Code>{filter.default_columns.join(", ") || "-"}</Code>
              </Table.Td>
              <Table.Td>
                {filter.conditions.map((c) => (
                  <div key={`${c.field}-${c.operator}-${JSON.stringify(c.value)}`}>
                    <Code>
                      {c.field} {c.operator} {JSON.stringify(c.value)}
                    </Code>
                  </div>
                ))}
              </Table.Td>
              <Table.Td style={{ whiteSpace: "nowrap" }}>
                <Code>{filter.sort.join(", ")}</Code>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Link to="/spaces/$slug/filters/$filterName/edit" params={{ slug: spaceSlug, filterName: filter.name }}>
                    <ActionIcon variant="subtle">
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Link>
                  <DeleteButton
                    title="Delete Filter"
                    message={`Are you sure you want to delete filter "${filter.name}"?`}
                    onConfirm={() => {
                      deleteFilterMutation.mutate(filter.name, {
                        onSuccess: () => {
                          notifications.show({
                            message: "Filter deleted successfully",
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

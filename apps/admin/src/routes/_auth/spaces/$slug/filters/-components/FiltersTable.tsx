import { Code, Paper, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { DeleteButton } from "@spacenote/common/components"
import type { Filter } from "@spacenote/common/types"

interface FiltersTableProps {
  spaceSlug: string
  filters: Filter[]
}

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
            <Table.Th>Display Fields</Table.Th>
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
                <Code>{filter.notes_list_default_columns.join(", ") || "-"}</Code>
              </Table.Td>
              <Table.Td>
                {filter.conditions.map((c, i) => (
                  <div key={`${c.field}-${c.operator}-${String(i)}`}>
                    <Code>
                      {c.field} {c.operator} {JSON.stringify(c.value)}
                    </Code>
                  </div>
                ))}
              </Table.Td>
              <Table.Td>
                <Code>{filter.sort.join(", ")}</Code>
              </Table.Td>
              <Table.Td>
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
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

import { Paper, Table } from "@mantine/core"
import type { Space } from "@spacenote/common/types"

import { SpaceMenu } from "@/components/SpaceMenu"

interface SpacesTableProps {
  spaces: Space[]
}

export function SpacesTable({ spaces }: SpacesTableProps) {
  return (
    <Paper withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Space</Table.Th>
            <Table.Th>Members</Table.Th>
            <Table.Th>Fields</Table.Th>
            <Table.Th>Filters</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {spaces.map((space) => (
            <Table.Tr key={space.slug}>
              <Table.Td>
                <div>{space.slug}</div>
                <div>{space.title}</div>
              </Table.Td>
              <Table.Td>{space.members.join(", ") || "-"}</Table.Td>
              <Table.Td>
                {space.fields.length > 0
                  ? space.fields.map((f) => (
                      <div key={f.name}>
                        {f.name}: {f.type}
                      </div>
                    ))
                  : "-"}
              </Table.Td>
              <Table.Td>{space.filters.length > 0 ? space.filters.map((f) => <div key={f.name}>{f.name}</div>) : "-"}</Table.Td>
              <Table.Td>
                <SpaceMenu space={space} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

import { Paper, Table } from "@mantine/core"
import { CustomLink } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface SpacesTableProps {
  spaces: Space[]
}

export function SpacesTable({ spaces }: SpacesTableProps) {
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
            <Table.Th>Filters</Table.Th>
            <Table.Th>Settings</Table.Th>
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
              <Table.Td>
                <CustomLink to="/spaces/$slug/members" params={{ slug: space.slug }}>
                  {space.members.length} members
                </CustomLink>
              </Table.Td>
              <Table.Td>
                <CustomLink to="/spaces/$slug/fields" params={{ slug: space.slug }}>
                  {space.fields.length} fields
                </CustomLink>
              </Table.Td>
              <Table.Td>
                <CustomLink to="/spaces/$slug/filters" params={{ slug: space.slug }}>
                  {space.filters.length} filters
                </CustomLink>
              </Table.Td>
              <Table.Td>
                <CustomLink to="/spaces/$slug/settings" params={{ slug: space.slug }}>
                  Settings
                </CustomLink>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

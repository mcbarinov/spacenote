import { Paper, Table, Text } from "@mantine/core"
import { SpaceSlug } from "@spacenote/common/components"
import type { TelegramMirror } from "@spacenote/common/types"
import { formatDate } from "@spacenote/common/utils"

interface TelegramMirrorsTableProps {
  mirrors: TelegramMirror[]
}

/** Table displaying telegram mirrors with space, note, and channel details */
export function TelegramMirrorsTable({ mirrors }: TelegramMirrorsTableProps) {
  if (mirrors.length === 0) {
    return (
      <Paper withBorder p="md">
        <Text c="dimmed">No telegram mirrors found</Text>
      </Paper>
    )
  }

  return (
    <Paper withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Space</Table.Th>
            <Table.Th>Note</Table.Th>
            <Table.Th>Channel</Table.Th>
            <Table.Th>Message ID</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Updated</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {mirrors.map((mirror) => (
            <Table.Tr key={`${mirror.space_slug}-${String(mirror.note_number)}`}>
              <Table.Td>
                <SpaceSlug slug={mirror.space_slug} />
              </Table.Td>
              <Table.Td>{mirror.note_number}</Table.Td>
              <Table.Td>{mirror.channel_id}</Table.Td>
              <Table.Td>{mirror.message_id}</Table.Td>
              <Table.Td>{formatDate(mirror.created_at)}</Table.Td>
              <Table.Td>{mirror.updated_at ? formatDate(mirror.updated_at) : "-"}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

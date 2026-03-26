import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Group, Paper, Select, Stack, Table, Text } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import type { TelegramMirror } from "@/types"
import { formatDate } from "@/utils/format"

const searchSchema = z.object({
  space_slug: z.string().optional(),
})

export const Route = createFileRoute("/_auth/_admin/admin/telegram/mirrors")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(api.queries.listTelegramMirrors(deps))
  },
  component: TelegramMirrorsPage,
})

/** Table displaying telegram mirrors with space, note, and channel details */
function TelegramMirrorsTable({ mirrors }: { mirrors: TelegramMirror[] }) {
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
            <Table.Tr key={`${mirror.space_slug}-${mirror.note_number}`}>
              <Table.Td>◈ {mirror.space_slug}</Table.Td>
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

/** Admin page for viewing telegram mirrors */
function TelegramMirrorsPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()
  const spaces = api.cache.useSpaces()

  const { data } = useSuspenseQuery(api.queries.listTelegramMirrors(search))

  return (
    <Stack gap="md">
      <PageHeader breadcrumbs={[{ label: "Telegram Mirrors" }]} />

      <Group>
        <Select
          placeholder="All spaces"
          clearable
          data={spaces.map((s) => ({ value: s.slug, label: s.title }))}
          value={search.space_slug ?? null}
          onChange={(value) => {
            void navigate({
              search: (prev) => ({
                ...prev,
                space_slug: value ?? undefined,
              }),
            })
          }}
          w={200}
        />
      </Group>

      <TelegramMirrorsTable mirrors={data.items} />
    </Stack>
  )
}

import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Badge, Code, Group, Modal, Paper, Select, Stack, Table, Text } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { TELEGRAM_TASK_STATUSES, TELEGRAM_TASK_TYPES, type TelegramTask, type TelegramTaskStatus } from "@/types"
import { formatDate } from "@/utils/format"

const searchSchema = z.object({
  space_slug: z.string().optional(),
  task_type: z
    .enum(["activity_note_created", "activity_note_updated", "activity_comment_created", "mirror_create", "mirror_update"])
    .optional(),
  status: z.enum(["pending", "completed", "failed"]).optional(),
})

export const Route = createFileRoute("/_auth/_admin/admin/telegram/tasks")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(api.queries.listTelegramTasks(deps))
  },
  component: TelegramTasksPage,
})

const statusColors: Record<TelegramTaskStatus, string> = { completed: "green", pending: "yellow", failed: "red" }

/** Table displaying telegram tasks with status, type, and details */
function TelegramTasksTable({ tasks }: { tasks: TelegramTask[] }) {
  const [selectedTask, setSelectedTask] = useState<TelegramTask | null>(null)

  if (tasks.length === 0) {
    return (
      <Paper withBorder p="md">
        <Text c="dimmed">No telegram tasks found</Text>
      </Paper>
    )
  }

  return (
    <>
      <Paper withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Status</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Space</Table.Th>
              <Table.Th>Note</Table.Th>
              <Table.Th>Channel</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Error</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tasks.map((task) => (
              <Table.Tr
                key={`${task.space_slug}-${task.number}`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedTask(task)
                }}
              >
                <Table.Td>
                  <Badge color={statusColors[task.status]} style={{ width: "max-content" }}>
                    {task.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{task.task_type}</Table.Td>
                <Table.Td>◈ {task.space_slug}</Table.Td>
                <Table.Td>{task.note_number}</Table.Td>
                <Table.Td>{task.channel_id}</Table.Td>
                <Table.Td>{formatDate(task.created_at)}</Table.Td>
                <Table.Td>
                  {task.error ? (
                    <Text c="red" size="sm">
                      {task.error}
                    </Text>
                  ) : (
                    "-"
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal
        opened={selectedTask !== null}
        onClose={() => {
          setSelectedTask(null)
        }}
        title={selectedTask ? `Task ${selectedTask.space_slug}/${selectedTask.number}` : ""}
        size="lg"
      >
        <Code block>{JSON.stringify(selectedTask, null, 2)}</Code>
      </Modal>
    </>
  )
}

/** Admin page for viewing telegram task history */
function TelegramTasksPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()
  const spaces = api.cache.useSpaces()

  const { data } = useSuspenseQuery(api.queries.listTelegramTasks(search))

  function handleFilterChange(key: keyof typeof search, value: string | null) {
    void navigate({
      search: (prev) => ({
        ...prev,
        [key]: value ?? undefined,
      }),
    })
  }

  return (
    <Stack gap="md">
      <PageHeader breadcrumbs={[{ label: "Telegram Tasks" }]} />

      <Group>
        <Select
          placeholder="All spaces"
          clearable
          data={spaces.map((s) => ({ value: s.slug, label: s.title }))}
          value={search.space_slug ?? null}
          onChange={(value) => {
            handleFilterChange("space_slug", value)
          }}
          w={200}
        />
        <Select
          placeholder="All types"
          clearable
          data={TELEGRAM_TASK_TYPES.map((t) => ({ value: t, label: t }))}
          value={search.task_type ?? null}
          onChange={(value) => {
            handleFilterChange("task_type", value)
          }}
          w={200}
        />
        <Select
          placeholder="All statuses"
          clearable
          data={TELEGRAM_TASK_STATUSES.map((s) => ({ value: s, label: s }))}
          value={search.status ?? null}
          onChange={(value) => {
            handleFilterChange("status", value)
          }}
          w={150}
        />
      </Group>

      <TelegramTasksTable tasks={data.items} />
    </Stack>
  )
}

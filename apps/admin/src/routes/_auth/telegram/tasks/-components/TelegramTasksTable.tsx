import { useState } from "react"
import { Badge, Code, Modal, Paper, Table, Text } from "@mantine/core"
import type { TelegramTask, TelegramTaskStatus } from "@spacenote/common/types"
import { formatDate } from "@spacenote/common/utils"

interface TelegramTasksTableProps {
  tasks: TelegramTask[]
}

/** Returns badge color based on task status */
function getStatusColor(status: TelegramTaskStatus): string {
  switch (status) {
    case "completed":
      return "green"
    case "pending":
      return "yellow"
    case "failed":
      return "red"
  }
}

/** Table displaying telegram tasks with status, type, and details */
export function TelegramTasksTable({ tasks }: TelegramTasksTableProps) {
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
                key={`${task.space_slug}-${String(task.number)}`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedTask(task)
                }}
              >
                <Table.Td>
                  <Badge color={getStatusColor(task.status)}>{task.status}</Badge>
                </Table.Td>
                <Table.Td>{task.task_type}</Table.Td>
                <Table.Td>{task.space_slug}</Table.Td>
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
        title={selectedTask ? `Task ${selectedTask.space_slug}/${String(selectedTask.number)}` : ""}
        size="lg"
      >
        <Code block>{JSON.stringify(selectedTask, null, 2)}</Code>
      </Modal>
    </>
  )
}

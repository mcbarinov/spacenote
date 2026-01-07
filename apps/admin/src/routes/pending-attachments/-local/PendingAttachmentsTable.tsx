import { useState } from "react"
import { ActionIcon, Group, Paper, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconDownload, IconEye } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import { DeleteButton, Username } from "@spacenote/common/components"
import type { PendingAttachment } from "@spacenote/common/types"
import { formatDate, formatFileSize } from "@spacenote/common/utils"
import { PreviewModal } from "./PreviewModal"
import { getPreviewType } from "./preview-utils"

interface PendingAttachmentsTableProps {
  attachments: PendingAttachment[]
}

/** Table displaying pending attachments with preview, download, and delete actions */
export function PendingAttachmentsTable({ attachments }: PendingAttachmentsTableProps) {
  const [previewAttachment, setPreviewAttachment] = useState<PendingAttachment | null>(null)
  const deleteMutation = api.mutations.useDeletePendingAttachment()

  if (attachments.length === 0) {
    return (
      <Paper withBorder p="md">
        <Text c="dimmed">No pending attachments</Text>
      </Paper>
    )
  }

  return (
    <Paper withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Number</Table.Th>
            <Table.Th>Author</Table.Th>
            <Table.Th>Filename</Table.Th>
            <Table.Th>Size</Table.Th>
            <Table.Th>MIME Type</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {attachments.map((attachment) => (
            <Table.Tr key={attachment.number}>
              <Table.Td>{attachment.number}</Table.Td>
              <Table.Td>
                <Username username={attachment.author} />
              </Table.Td>
              <Table.Td>{attachment.filename}</Table.Td>
              <Table.Td>{formatFileSize(attachment.size)}</Table.Td>
              <Table.Td>{attachment.mime_type}</Table.Td>
              <Table.Td>{formatDate(attachment.created_at)}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {getPreviewType(attachment.mime_type) !== null && (
                    <ActionIcon
                      variant="subtle"
                      onClick={() => {
                        setPreviewAttachment(attachment)
                      }}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  )}
                  <ActionIcon
                    component="a"
                    href={`/api/v1/attachments/pending/${attachment.number}`}
                    target="_blank"
                    variant="subtle"
                  >
                    <IconDownload size={18} />
                  </ActionIcon>
                  <DeleteButton
                    title="Delete Pending Attachment"
                    message={`Are you sure you want to delete "${attachment.filename}"?`}
                    onConfirm={() => {
                      deleteMutation.mutate(attachment.number, {
                        onSuccess: () => {
                          notifications.show({
                            message: "Pending attachment deleted",
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
      <PreviewModal
        attachment={previewAttachment}
        onClose={() => {
          setPreviewAttachment(null)
        }}
      />
    </Paper>
  )
}

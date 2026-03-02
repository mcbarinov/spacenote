import { useState } from "react"
import { ActionIcon, Button, Group, Modal, Select, Stack } from "@mantine/core"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { IconArrowMoveRight } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface TransferNoteButtonProps {
  space: Space
  noteNumber: number
}

/** ActionIcon that transfers a note to another space */
export function TransferNoteButton({ space, noteNumber }: TransferNoteButtonProps) {
  const targets = space.can_transfer_to
  if (targets.length === 0) return null

  if (targets.length === 1) {
    return <SingleTargetButton spaceSlug={space.slug} noteNumber={noteNumber} target={targets[0]} />
  }

  return <MultiTargetButton spaceSlug={space.slug} noteNumber={noteNumber} targets={targets} />
}

/** Transfer with confirm modal when there's only one target */
function SingleTargetButton({ spaceSlug, noteNumber, target }: { spaceSlug: string; noteNumber: number; target: string }) {
  const navigate = useNavigate()
  const transferMutation = api.mutations.useTransferNote(spaceSlug, noteNumber)

  return (
    <ActionIcon
      variant="subtle"
      title="Transfer note"
      onClick={() => {
        modals.openConfirmModal({
          title: "Transfer Note",
          children: `Transfer note #${noteNumber} to space "${target}"?`,
          labels: { confirm: "Transfer", cancel: "Cancel" },
          onConfirm: () => {
            transferMutation.mutate(
              { target_space: target },
              {
                onSuccess: (data) => {
                  notifications.show({ message: `Note transferred to ${data.space_slug}`, color: "green" })
                  void navigate({
                    to: "/s/$slug/$noteNumber",
                    params: { slug: data.space_slug, noteNumber: String(data.number) },
                  })
                },
                onError: (error) => {
                  notifications.show({ message: String(error), color: "red" })
                },
              }
            )
          },
        })
      }}
    >
      <IconArrowMoveRight size={18} />
    </ActionIcon>
  )
}

/** Transfer with modal + select dropdown when there are multiple targets */
function MultiTargetButton({ spaceSlug, noteNumber, targets }: { spaceSlug: string; noteNumber: number; targets: string[] }) {
  const navigate = useNavigate()
  const [opened, setOpened] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const transferMutation = api.mutations.useTransferNote(spaceSlug, noteNumber)

  const handleTransfer = () => {
    if (!selected) return
    transferMutation.mutate(
      { target_space: selected },
      {
        onSuccess: (data) => {
          setOpened(false)
          notifications.show({ message: `Note transferred to ${data.space_slug}`, color: "green" })
          void navigate({ to: "/s/$slug/$noteNumber", params: { slug: data.space_slug, noteNumber: String(data.number) } })
        },
      }
    )
  }

  return (
    <>
      <ActionIcon
        variant="subtle"
        title="Transfer note"
        onClick={() => {
          setOpened(true)
        }}
      >
        <IconArrowMoveRight size={18} />
      </ActionIcon>
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false)
        }}
        title="Transfer Note"
      >
        <Stack gap="md">
          <Select label="Target space" placeholder="Select a space" data={targets} value={selected} onChange={setSelected} />
          {transferMutation.error && <ErrorMessage error={transferMutation.error} />}
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setOpened(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleTransfer} loading={transferMutation.isPending} disabled={!selected}>
              Transfer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

import { ActionIcon, type ActionIconProps } from "@mantine/core"
import { modals } from "@mantine/modals"
import { IconTrash } from "@tabler/icons-react"

/** Props for delete button with confirmation */
interface DeleteButtonProps extends Omit<ActionIconProps, "onClick"> {
  title: string
  message: string
  onConfirm: () => void
}

/** Action icon that opens confirm modal before delete */
export function DeleteButton({ title, message, onConfirm, ...props }: DeleteButtonProps) {
  const handleClick = () => {
    modals.openConfirmModal({
      title,
      children: message,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm,
    })
  }

  return (
    <ActionIcon variant="subtle" color="red" onClick={handleClick} {...props}>
      <IconTrash size={18} />
    </ActionIcon>
  )
}

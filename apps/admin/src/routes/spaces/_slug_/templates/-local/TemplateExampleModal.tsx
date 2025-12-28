import { Modal, Code, ScrollArea } from "@mantine/core"

interface TemplateExampleModalProps {
  opened: boolean
  onClose: () => void
  title: string
  example: string
}

export function TemplateExampleModal({ opened, onClose, title, example }: TemplateExampleModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg">
      <ScrollArea.Autosize mah={500}>
        <Code block style={{ whiteSpace: "pre-wrap" }}>
          {example}
        </Code>
      </ScrollArea.Autosize>
    </Modal>
  )
}

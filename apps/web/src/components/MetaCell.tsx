import { Code, Text, UnstyledButton } from "@mantine/core"
import { modals } from "@mantine/modals"

interface MetaCellProps {
  meta: Record<string, unknown>
}

/** Displays attachment metadata as clickable table cell. Shows keys as link, opens modal with full JSON on click. */
export function MetaCell({ meta }: MetaCellProps) {
  const keys = Object.keys(meta)
  if (keys.length === 0) return <Text c="dimmed">-</Text>

  function handleClick() {
    modals.open({
      title: "Metadata",
      size: "lg",
      children: <Code block>{JSON.stringify(meta, null, 2)}</Code>,
    })
  }

  return (
    <UnstyledButton onClick={handleClick}>
      <Text c="blue" td="underline">
        {keys.join(", ")}
      </Text>
    </UnstyledButton>
  )
}

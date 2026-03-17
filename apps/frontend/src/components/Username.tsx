import { Group } from "@mantine/core"

/** Displays username with user icon */
export function Username({ username }: { username: string }) {
  return (
    <Group component="span" gap={4} display="inline-flex" wrap="nowrap">
      <span aria-hidden="true">👤</span>
      <span>{username}</span>
    </Group>
  )
}

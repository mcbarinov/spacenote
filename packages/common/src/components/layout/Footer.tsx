import { Divider, Text } from "@mantine/core"

/** App footer with copyright */
export function Footer() {
  return (
    <footer>
      <Divider my="md" />
      <Text size="sm" c="dimmed" pb="md">
        © 2025 SpaceNote
      </Text>
    </footer>
  )
}

import { Divider, Text } from "@mantine/core"

export default function Header() {
  return (
    <header>
      <Divider my="md" />
      <Text size="sm" c="dimmed" pb="md">
        © 2025 DemoForums
      </Text>
    </header>
  )
}

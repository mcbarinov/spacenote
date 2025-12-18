import { Divider, Text } from "@mantine/core"
import { getUserTimezoneOffset } from "../../utils"

/** App footer with copyright and user timezone */
export function Footer() {
  return (
    <footer>
      <Divider my="md" />
      <Text size="sm" c="dimmed" pb="md">
        © 2025 SpaceNote · {getUserTimezoneOffset()}
      </Text>
    </footer>
  )
}

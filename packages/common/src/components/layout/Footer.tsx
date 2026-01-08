import { Anchor, Divider, Text } from "@mantine/core"
import { getUserTimezoneOffset } from "../../utils"

const COMMIT_HASH = import.meta.env.VITE_GIT_COMMIT_HASH as string | undefined

/** App footer with copyright, timezone, and optional commit link */
export function Footer() {
  return (
    <footer>
      <Divider my="md" />
      <Text size="sm" c="dimmed" pb="md">
        © 2025 SpaceNote · {getUserTimezoneOffset()}
        {COMMIT_HASH && COMMIT_HASH !== "unknown" && (
          <>
            {" · "}
            <Anchor href={`https://github.com/mcbarinov/spacenote/commit/${COMMIT_HASH}`} target="_blank" size="sm" c="dimmed">
              {COMMIT_HASH.slice(0, 7)}
            </Anchor>
          </>
        )}
      </Text>
    </footer>
  )
}

import { Anchor, Divider, Text } from "@mantine/core"

const COMMIT_HASH = import.meta.env.VITE_GIT_COMMIT_HASH as string | undefined

/** Get the user's timezone offset (e.g., "UTC+3", "UTC-5") */
function getUserTimezoneOffset(): string {
  const offsetMinutes = -new Date().getTimezoneOffset()
  const offsetHours = offsetMinutes / 60
  const sign = offsetHours >= 0 ? "+" : ""
  return `UTC${sign}${offsetHours}`
}

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

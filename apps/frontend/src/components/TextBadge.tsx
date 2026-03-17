import { Badge, type BadgeProps } from "@mantine/core"

/** Badge that never truncates text */
export function TextBadge(props: BadgeProps) {
  return <Badge {...props} style={{ width: "max-content" }} />
}

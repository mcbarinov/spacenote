import { Group } from "@mantine/core"

/** Displays space slug with icon */
export function SpaceSlug({ slug }: { slug: string }) {
  return (
    <Group component="span" gap={4} display="inline-flex" wrap="nowrap">
      <span aria-hidden="true">◈</span>
      <span>{slug}</span>
    </Group>
  )
}

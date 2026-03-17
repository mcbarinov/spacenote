import { Card, Text, Title } from "@mantine/core"
import { SpaceSlug } from "@/components/SpaceSlug"
import type { Space } from "@/types"

interface SpaceCardProps {
  space: Space
}

/** Card link to a space with title and description */
export default function SpaceCard({ space }: SpaceCardProps) {
  return (
    <a href={`/s/${space.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <Card shadow="sm" padding="lg" withBorder>
        <Text size="xs" c="dimmed" mb={4}>
          <SpaceSlug slug={space.slug} />
        </Text>
        <Title order={3} mb="xs">
          {space.title}
        </Title>
        {space.description && (
          <Text c="dimmed" size="sm" lineClamp={2}>
            {space.description}
          </Text>
        )}
      </Card>
    </a>
  )
}

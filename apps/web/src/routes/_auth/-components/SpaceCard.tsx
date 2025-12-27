import { Card, Text, Title } from "@mantine/core"
import { Link } from "@tanstack/react-router"
import { SpaceSlug } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface SpaceCardProps {
  space: Space
}

/** Card link to a space with title and description */
export default function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link to="/s/$slug" params={{ slug: space.slug }} style={{ textDecoration: "none" }}>
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
    </Link>
  )
}

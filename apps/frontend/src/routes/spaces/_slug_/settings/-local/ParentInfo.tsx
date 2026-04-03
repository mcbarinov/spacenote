import { Group, Paper, Stack, Text, Title } from "@mantine/core"
import { CustomLink } from "@/components/CustomLink"
import type { Space } from "@/types"
import { useChildSpaces, useParentSpace } from "@/routes/spaces/-shared/inheritance"

interface ParentInfoProps {
  space: Space
}

/** Displays parent-child relationship info for a space. */
export function ParentInfo({ space }: ParentInfoProps) {
  const parentSpace = useParentSpace(space)
  const children = useChildSpaces(space)

  if (!parentSpace && children.length === 0) return null

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <Title order={3}>Inheritance</Title>
        {parentSpace && (
          <Group gap="xs">
            <Text>Parent:</Text>
            <CustomLink to="/spaces/$slug/settings" params={{ slug: parentSpace.slug }}>
              {parentSpace.title} ({parentSpace.slug})
            </CustomLink>
          </Group>
        )}
        {children.length > 0 && (
          <Group gap="xs">
            <Text>Children:</Text>
            {children.map((child, i) => (
              <span key={child.slug}>
                <CustomLink to="/spaces/$slug/settings" params={{ slug: child.slug }}>
                  {child.slug}
                </CustomLink>
                {i < children.length - 1 && ", "}
              </span>
            ))}
          </Group>
        )}
      </Stack>
    </Paper>
  )
}

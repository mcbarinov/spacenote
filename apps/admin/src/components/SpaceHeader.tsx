import type { ReactNode } from "react"
import { Breadcrumbs, Group, Stack, Text, Title } from "@mantine/core"
import { CustomLink } from "@spacenote/common/components"

interface BreadcrumbItem {
  label: string
  to: string
}

interface SpaceHeaderProps {
  title: string
  /** If provided, shows breadcrumbs: Spaces / {slug} / ...parents */
  slug?: string
  /** Intermediate breadcrumb links between slug and title */
  parents?: BreadcrumbItem[]
  /** Action buttons displayed on the right side of the header */
  actions?: ReactNode
}

/**
 * Page header for space-related pages with title, optional breadcrumbs and action buttons.
 */
export function SpaceHeader({ title, slug, parents = [], actions }: SpaceHeaderProps) {
  const showBreadcrumbs = slug !== undefined

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Title order={1}>{title}</Title>
        {actions}
      </Group>
      {showBreadcrumbs && (
        <Breadcrumbs>
          <CustomLink to="/spaces" underline="hover" c="blue">
            Spaces
          </CustomLink>
          <Text>⬢ {slug}</Text>
          {parents.map((item) => (
            <CustomLink key={item.to} to={item.to} params={{ slug }} underline="hover" c="blue">
              {item.label}
            </CustomLink>
          ))}
        </Breadcrumbs>
      )}
    </Stack>
  )
}

import type { ReactNode } from "react"
import { Breadcrumbs, Button, Group, Stack, Title } from "@mantine/core"
import { CustomLink, SpaceSlug } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"
import { useLocation, useNavigate } from "@tanstack/react-router"
import type { FileRouteTypes } from "@/routeTree.gen"

interface SpaceHeaderProps {
  title: string
  /** If provided, shows breadcrumbs and navigation tabs */
  space?: Space
  /** Action buttons displayed on the right side of the header */
  actions?: ReactNode
}

/** Header with breadcrumbs and navigation tabs for space pages */
export function SpaceHeader({ title, space, actions }: SpaceHeaderProps) {
  return (
    <Stack gap="xs">
      {space && (
        <Group justify="space-between">
          <Breadcrumbs>
            <CustomLink to="/spaces" underline="hover" c="blue">
              Spaces
            </CustomLink>
            <SpaceSlug slug={space.slug} />
          </Breadcrumbs>
          <SpaceTabs space={space} />
        </Group>
      )}
      <Group justify="space-between">
        <Title order={1}>{title}</Title>
        {actions}
      </Group>
    </Stack>
  )
}

interface SpaceTab {
  label: string
  path: string
  to: FileRouteTypes["to"]
}

/** Navigation tabs for space sections (members, fields, filters, settings) */
function SpaceTabs({ space }: { space: Space }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { slug } = space

  const tabs: SpaceTab[] = [
    { label: `Members (${String(space.members.length)})`, path: "members", to: "/spaces/$slug/members" },
    { label: `Fields (${String(space.fields.length)})`, path: "fields", to: "/spaces/$slug/fields" },
    { label: `Filters (${String(space.filters.length)})`, path: "filters", to: "/spaces/$slug/filters" },
    { label: "Export", path: "export", to: "/spaces/$slug/export" },
    { label: "Settings", path: "settings", to: "/spaces/$slug/settings" },
  ]

  return (
    <Group gap="xs">
      {tabs.map((tab) => {
        const isActive = location.pathname.includes(`/spaces/${slug}/${tab.path}`)
        return (
          <Button
            key={tab.path}
            variant={isActive ? "light" : "subtle"}
            size="xs"
            onClick={() => void navigate({ to: tab.to, params: { slug } })}
          >
            {tab.label}
          </Button>
        )
      })}
    </Group>
  )
}

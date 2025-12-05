import { Button, Group } from "@mantine/core"
import type { Space } from "@spacenote/common/types"
import { useLocation, useNavigate } from "@tanstack/react-router"
import type { FileRouteTypes } from "@/routeTree.gen"

interface SpaceTab {
  label: string
  path: string
  to: FileRouteTypes["to"]
}

interface SpaceTabsProps {
  space: Space
}

/** Navigation tabs for space sections (members, fields, filters, settings) */
export function SpaceTabs({ space }: SpaceTabsProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { slug } = space

  const tabs: SpaceTab[] = [
    { label: `Members (${String(space.members.length)})`, path: "members", to: "/spaces/$slug/members" },
    { label: `Fields (${String(space.fields.length)})`, path: "fields", to: "/spaces/$slug/fields" },
    { label: `Filters (${String(space.filters.length)})`, path: "filters", to: "/spaces/$slug/filters" },
    { label: "Templates", path: "templates", to: "/spaces/$slug/templates" },
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

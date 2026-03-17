import { NavigationTabs } from "@/components/NavigationTabs"
import type { Space } from "@/types"

interface SpaceTabsProps {
  space: Space
}

/** Navigation tabs for space sections */
export function SpaceTabs({ space }: SpaceTabsProps) {
  const { slug } = space
  return (
    <NavigationTabs
      tabs={[
        { label: `Members (${space.members.length})`, to: "/admin/spaces/$slug/members", params: { slug } },
        { label: `Fields (${space.fields.length})`, to: "/admin/spaces/$slug/fields", params: { slug } },
        { label: `Filters (${space.filters.length})`, to: "/admin/spaces/$slug/filters", params: { slug } },
        { label: "Templates", to: "/admin/spaces/$slug/templates", params: { slug } },
        { label: "Export", to: "/admin/spaces/$slug/export", params: { slug } },
        { label: "Settings", to: "/admin/spaces/$slug/settings", params: { slug } },
      ]}
    />
  )
}

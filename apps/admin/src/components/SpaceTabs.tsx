import { NavigationTabs } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"

interface SpaceTabsProps {
  space: Space
}

/** Navigation tabs for space sections */
export function SpaceTabs({ space }: SpaceTabsProps) {
  const { slug } = space
  return (
    <NavigationTabs
      tabs={[
        { label: `Members (${String(space.members.length)})`, to: "/spaces/$slug/members", params: { slug } },
        { label: `Fields (${String(space.fields.length)})`, to: "/spaces/$slug/fields", params: { slug } },
        { label: `Filters (${String(space.filters.length)})`, to: "/spaces/$slug/filters", params: { slug } },
        { label: "Templates", to: "/spaces/$slug/templates", params: { slug } },
        { label: "Export", to: "/spaces/$slug/export", params: { slug } },
        { label: "Settings", to: "/spaces/$slug/settings", params: { slug } },
      ]}
    />
  )
}

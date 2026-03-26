import { Tabs } from "@mantine/core"
import { useLocation, useNavigate } from "@tanstack/react-router"
import type { Space } from "@/types"

interface TabItem {
  label: string
  to: string
  params?: Record<string, string>
}

/** Router-integrated navigation tabs */
function NavigationTabs({ tabs }: { tabs: TabItem[] }) {
  const location = useLocation()
  const navigate = useNavigate()

  const activeValue = tabs.find((tab) => {
    let path = tab.to
    if (tab.params) {
      for (const [key, value] of Object.entries(tab.params)) {
        path = path.replace(`$${key}`, value)
      }
    }
    return location.pathname === path || location.pathname === `${path}/`
  })?.to

  return (
    <Tabs
      value={activeValue}
      onChange={(value) => {
        const tab = tabs.find((t) => t.to === value)
        if (tab) void navigate({ to: tab.to, params: tab.params })
      }}
    >
      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Tab key={tab.to} value={tab.to}>
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  )
}

interface SpaceTabsProps {
  space: Space
}

/** Navigation tabs for space sections */
export function SpaceTabs({ space }: SpaceTabsProps) {
  const { slug } = space
  return (
    <NavigationTabs
      tabs={[
        { label: `Members (${space.members.length})`, to: "/spaces/$slug/members", params: { slug } },
        { label: `Fields (${space.fields.length})`, to: "/spaces/$slug/fields", params: { slug } },
        { label: `Filters (${space.filters.length})`, to: "/spaces/$slug/filters", params: { slug } },
        { label: "Templates", to: "/spaces/$slug/templates", params: { slug } },
        { label: "Export", to: "/spaces/$slug/export", params: { slug } },
        { label: "Settings", to: "/spaces/$slug/settings", params: { slug } },
      ]}
    />
  )
}

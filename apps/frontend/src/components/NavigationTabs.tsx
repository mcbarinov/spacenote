import { Tabs } from "@mantine/core"
import { useLocation, useNavigate } from "@tanstack/react-router"

interface TabItem {
  label: string
  to: string
  params?: Record<string, string>
}

interface NavigationTabsProps {
  tabs: TabItem[]
}

/** Router-integrated navigation tabs */
export function NavigationTabs({ tabs }: NavigationTabsProps) {
  const location = useLocation()
  const navigate = useNavigate()

  // Find active tab by matching pathname
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

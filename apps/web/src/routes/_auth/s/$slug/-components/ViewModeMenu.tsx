import { ActionIcon, Menu } from "@mantine/core"
import { IconDotsVertical } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"

type ViewMode = "default" | "template" | "json"

interface ViewModeMenuProps {
  slug: string
  filter: string | undefined
  currentView: ViewMode
  hasTemplate: boolean
}

/** Dropdown menu for switching notes list view modes */
export function ViewModeMenu({ slug, filter, currentView, hasTemplate }: ViewModeMenuProps) {
  const navigate = useNavigate()

  const handleViewChange = (view: ViewMode) => {
    void navigate({
      to: "/s/$slug",
      params: { slug },
      search: { filter, view },
    })
  }

  return (
    <Menu>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDotsVertical size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          disabled={currentView === "default"}
          onClick={() => {
            handleViewChange("default")
          }}
        >
          Default
        </Menu.Item>
        {hasTemplate && (
          <Menu.Item
            disabled={currentView === "template"}
            onClick={() => {
              handleViewChange("template")
            }}
          >
            Template
          </Menu.Item>
        )}
        <Menu.Item
          disabled={currentView === "json"}
          onClick={() => {
            handleViewChange("json")
          }}
        >
          JSON
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

import { ActionIcon, Menu } from "@mantine/core"
import { IconDotsVertical } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"

type ViewMode = "default" | "template" | "json"

interface ViewModeMenuProps {
  slug: string
  noteNumber: string
  currentView: ViewMode
  hasTemplate: boolean
}

/** Dropdown menu for switching note view modes */
export function ViewModeMenu({ slug, noteNumber, currentView, hasTemplate }: ViewModeMenuProps) {
  const navigate = useNavigate()

  const handleViewChange = (view: ViewMode) => {
    void navigate({
      to: "/s/$slug/$noteNumber",
      params: { slug, noteNumber },
      search: { view },
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

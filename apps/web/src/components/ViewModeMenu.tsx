import { ActionIcon, Menu } from "@mantine/core"
import { IconDotsVertical } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"

type ViewMode = "default" | "template" | "json"

interface ViewModeMenuProps {
  slug: string
  currentView: ViewMode
  hasTemplate: boolean
  /** For notes list view - preserves filter in navigation */
  filter?: string
  /** For single note view - navigates to specific note */
  noteNumber?: string
}

/** Dropdown menu for switching between view modes: default table, custom template, or raw JSON. */
export function ViewModeMenu({ slug, currentView, hasTemplate, filter, noteNumber }: ViewModeMenuProps) {
  const navigate = useNavigate()

  function handleViewChange(view: ViewMode) {
    if (noteNumber) {
      void navigate({
        to: "/s/$slug/$noteNumber",
        params: { slug, noteNumber },
        search: { view },
      })
    } else {
      void navigate({
        to: "/s/$slug",
        params: { slug },
        search: { filter, view },
      })
    }
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

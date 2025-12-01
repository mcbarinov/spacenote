import { ActionIcon, Menu } from "@mantine/core"
import { IconDotsVertical, IconFilter, IconList, IconSettings, IconUsers } from "@tabler/icons-react"
import type { Space } from "@spacenote/common/types"
import { useNavigate } from "@tanstack/react-router"

interface SpaceMenuProps {
  space: Space
}

/** Dropdown menu with links to space sections */
export function SpaceMenu({ space }: SpaceMenuProps) {
  const navigate = useNavigate()
  const { slug } = space

  return (
    <Menu>
      <Menu.Target>
        <ActionIcon variant="subtle">
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconUsers size={16} />}
          onClick={() => void navigate({ to: "/spaces/$slug/members", params: { slug } })}
        >
          Members ({space.members.length})
        </Menu.Item>
        <Menu.Item
          leftSection={<IconList size={16} />}
          onClick={() => void navigate({ to: "/spaces/$slug/fields", params: { slug } })}
        >
          Fields ({space.fields.length})
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFilter size={16} />}
          onClick={() => void navigate({ to: "/spaces/$slug/filters", params: { slug } })}
        >
          Filters ({space.filters.length})
        </Menu.Item>
        <Menu.Item
          leftSection={<IconSettings size={16} />}
          onClick={() => void navigate({ to: "/spaces/$slug/settings", params: { slug } })}
        >
          Settings
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

import { ActionIcon, Menu } from "@mantine/core"
import { IconDotsVertical, IconDownload, IconFilter, IconList, IconSettings, IconTemplate, IconUsers } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import type { Space } from "@/types"

interface SpaceMenuProps {
  space: Space
}

interface SpaceMenuItemProps {
  to: string
  slug: string
  icon: React.ComponentType<{ size: number }>
  label: string
}

/** Menu item that renders as a real anchor for proper link behavior */
function SpaceMenuItem({ to, slug, icon: Icon, label }: SpaceMenuItemProps) {
  const href = to.replace("$slug", slug)
  const navigate = useNavigate()

  return (
    <Menu.Item
      component="a"
      href={href}
      leftSection={<Icon size={16} />}
      onClick={(e: React.MouseEvent) => {
        // Allow middle-click and ctrl/cmd+click to open in new tab
        if (e.button !== 0 || e.metaKey || e.ctrlKey) return
        e.preventDefault()
        void navigate({ to, params: { slug } })
      }}
    >
      {label}
    </Menu.Item>
  )
}

/** Dropdown menu with links to space sections */
export function SpaceMenu({ space }: SpaceMenuProps) {
  const { slug } = space

  return (
    <Menu>
      <Menu.Target>
        <ActionIcon variant="subtle">
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <SpaceMenuItem
          to="/admin/spaces/$slug/members"
          slug={slug}
          icon={IconUsers}
          label={`Members (${space.members.length})`}
        />
        <SpaceMenuItem to="/admin/spaces/$slug/fields" slug={slug} icon={IconList} label={`Fields (${space.fields.length})`} />
        <SpaceMenuItem
          to="/admin/spaces/$slug/filters"
          slug={slug}
          icon={IconFilter}
          label={`Filters (${space.filters.length})`}
        />
        <SpaceMenuItem to="/admin/spaces/$slug/templates" slug={slug} icon={IconTemplate} label="Templates" />
        <SpaceMenuItem to="/admin/spaces/$slug/export" slug={slug} icon={IconDownload} label="Export" />
        <SpaceMenuItem to="/admin/spaces/$slug/settings" slug={slug} icon={IconSettings} label="Settings" />
      </Menu.Dropdown>
    </Menu>
  )
}

import { ActionIcon, Card, Group, Menu, SimpleGrid, Text, Title } from "@mantine/core"
import { IconDotsVertical, IconDownload, IconFilter, IconList, IconSettings, IconTemplate, IconUsers } from "@tabler/icons-react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { api } from "@/api"
import type { Space } from "@/types"

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
function SpaceMenu({ space, icon: Icon = IconDotsVertical }: { space: Space; icon?: React.ComponentType<{ size: number }> }) {
  const { slug } = space

  return (
    <Menu>
      <Menu.Target>
        <ActionIcon variant="subtle">
          <Icon size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <SpaceMenuItem to="/spaces/$slug/members" slug={slug} icon={IconUsers} label={`Members (${space.members.length})`} />
        <SpaceMenuItem to="/spaces/$slug/fields" slug={slug} icon={IconList} label={`Fields (${space.fields.length})`} />
        <SpaceMenuItem to="/spaces/$slug/filters" slug={slug} icon={IconFilter} label={`Filters (${space.filters.length})`} />
        <SpaceMenuItem to="/spaces/$slug/templates" slug={slug} icon={IconTemplate} label="Templates" />
        <SpaceMenuItem to="/spaces/$slug/export" slug={slug} icon={IconDownload} label="Export" />
        <SpaceMenuItem to="/spaces/$slug/settings" slug={slug} icon={IconSettings} label="Settings" />
      </Menu.Dropdown>
    </Menu>
  )
}

/** Displays space slug with icon */
function SpaceSlug({ slug }: { slug: string }) {
  return (
    <Group component="span" gap={4} display="inline-flex" wrap="nowrap">
      <span aria-hidden="true">◈</span>
      <span>{slug}</span>
    </Group>
  )
}

/** Card link to a space with title and description */
function SpaceCard({ space }: { space: Space }) {
  const navigate = useNavigate()
  const currentUser = api.cache.useCurrentUser()
  const member = space.members.find((m) => m.username === currentUser.username)
  const canManage = member?.permissions.includes("all") ?? false

  return (
    <Card
      shadow="sm"
      padding="lg"
      withBorder
      style={{ cursor: "pointer" }}
      onClick={() => {
        void navigate({ to: "/s/$slug", params: { slug: space.slug } })
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed" mb={4}>
            <SpaceSlug slug={space.slug} />
          </Text>
          {space.parent && (
            <Text size="xs" c="dimmed">
              ↳ child of {space.parent}
            </Text>
          )}
          <Title order={3} mb="xs">
            {space.title}
          </Title>
        </div>
        {canManage && (
          <span
            role="presentation"
            onClick={(e) => {
              e.stopPropagation()
            }}
            onKeyDown={(e) => {
              e.stopPropagation()
            }}
          >
            <SpaceMenu space={space} icon={IconSettings} />
          </span>
        )}
      </Group>
      {space.description && (
        <Text c="dimmed" size="sm" lineClamp={2}>
          {space.description}
        </Text>
      )}
    </Card>
  )
}

export const Route = createFileRoute("/_auth/")({
  component: SpacesGrid,
})

/** Grid of spaces the current user has access to */
function SpacesGrid() {
  const spaces = api.cache.useSpaces()

  return spaces.length === 0 ? (
    <Text c="dimmed">You don't have access to any spaces yet.</Text>
  ) : (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      {spaces.map((space) => (
        <SpaceCard key={space.slug} space={space} />
      ))}
    </SimpleGrid>
  )
}

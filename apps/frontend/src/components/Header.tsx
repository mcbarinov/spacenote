import { Divider, Group, Text, Menu, UnstyledButton } from "@mantine/core"
import { IconUser, IconChevronDown, IconLogout, IconUsers, IconSend, IconPaperclip, IconLayoutGrid } from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { api } from "@/api"

/** App header with logo and user menu */
export function Header() {
  const currentUser = api.cache.useCurrentUser()
  const navigate = useNavigate()
  const logoutMutation = api.mutations.useLogout()

  return (
    <header>
      <Divider mb="md" />
      <Group justify="space-between" py="sm">
        <Text component={Link} to="/" size="xl" fw={700}>
          SpaceNote
        </Text>

        <Menu>
          <Menu.Target>
            <UnstyledButton>
              <Group gap="xs">
                <IconUser size={20} />
                <Text fw={500}>{currentUser.username}</Text>
                <IconChevronDown size={16} />
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            {currentUser.username === "admin" && (
              <>
                <Menu.Item component={Link} to="/admin/spaces" leftSection={<IconLayoutGrid size={16} />}>
                  Spaces
                </Menu.Item>
                <Menu.Item component={Link} to="/admin/users" leftSection={<IconUsers size={16} />}>
                  Users
                </Menu.Item>
                <Menu.Item component={Link} to="/admin/telegram/tasks" leftSection={<IconSend size={16} />}>
                  Telegram Tasks
                </Menu.Item>
                <Menu.Item component={Link} to="/admin/telegram/mirrors" leftSection={<IconSend size={16} />}>
                  Telegram Mirrors
                </Menu.Item>
                <Menu.Item component={Link} to="/admin/pending-attachments" leftSection={<IconPaperclip size={16} />}>
                  Pending Attachments
                </Menu.Item>
                <Menu.Divider />
              </>
            )}
            <Menu.Item
              leftSection={<IconLogout size={16} />}
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSuccess: () => {
                    void navigate({ to: "/login" })
                  },
                })
              }}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <Divider />
    </header>
  )
}

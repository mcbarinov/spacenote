import { Divider, Group, Text, Menu, UnstyledButton } from "@mantine/core"
import { IconUser, IconChevronDown, IconLogout } from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { api } from "@spacenote/common/api"

export default function Header() {
  const currentUser = api.cache.useCurrentUser()
  const navigate = useNavigate()
  const logoutMutation = api.mutations.useLogout()

  return (
    <header>
      <Divider mb="md" />
      <Group justify="space-between" py="sm">
        {/* Left: Site name */}
        <Text component={Link} to="/" size="xl" fw={700}>
          SpaceNote Admin
        </Text>

        {/* Right: User dropdown menu */}
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
    </header>
  )
}

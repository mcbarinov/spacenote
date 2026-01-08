import { Link, createFileRoute } from "@tanstack/react-router"
import { Paper, SimpleGrid, Stack, Text, Title, UnstyledButton } from "@mantine/core"
import { IconCopy, IconLayout2, IconPaperclip, IconSend, IconUsers } from "@tabler/icons-react"

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
})

/** Admin dashboard with navigation links */
function HomePage() {
  return (
    <Stack gap="xl">
      <Title order={2}>Dashboard</Title>

      <SimpleGrid cols={2}>
        <DashboardCard to="/spaces" icon={IconLayout2} title="Spaces" />
        <DashboardCard to="/users" icon={IconUsers} title="Users" />
        <DashboardCard to="/telegram/tasks" icon={IconSend} title="Telegram Tasks" />
        <DashboardCard to="/telegram/mirrors" icon={IconCopy} title="Telegram Mirrors" />
        <DashboardCard to="/pending-attachments" icon={IconPaperclip} title="Pending Attachments" />
      </SimpleGrid>
    </Stack>
  )
}

interface DashboardCardProps {
  to: string
  icon: typeof IconUsers
  title: string
}

/** Clickable dashboard card with icon */
function DashboardCard({ to, icon: Icon, title }: DashboardCardProps) {
  return (
    <UnstyledButton component={Link} to={to}>
      <Paper
        withBorder
        p="xl"
        style={{
          transition: "box-shadow 150ms ease, transform 150ms ease",
        }}
        styles={{
          root: {
            "&:hover": {
              boxShadow: "var(--mantine-shadow-md)",
              transform: "translateY(-2px)",
            },
          },
        }}
      >
        <Stack align="center" gap="sm">
          <Icon size={40} stroke={1.5} color="var(--mantine-color-blue-6)" />
          <Text fw={500} size="lg">
            {title}
          </Text>
        </Stack>
      </Paper>
    </UnstyledButton>
  )
}

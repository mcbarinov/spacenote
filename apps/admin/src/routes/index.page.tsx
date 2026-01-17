import { Link, createFileRoute } from "@tanstack/react-router"
import { Paper, SimpleGrid, Stack, Text, Title, UnstyledButton } from "@mantine/core"
import { IconCopy, IconLayout2, IconPaperclip, IconSend, IconUsers } from "@tabler/icons-react"
import type { ReactNode } from "react"

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
})

const cardIconProps = { size: 40, stroke: 1.5, color: "var(--mantine-color-blue-6)" } as const

/** Admin dashboard with navigation links */
function HomePage() {
  return (
    <Stack gap="xl">
      <Title order={2}>Dashboard</Title>

      <SimpleGrid cols={2}>
        <DashboardCard to="/spaces" title="Spaces">
          <IconLayout2 {...cardIconProps} />
        </DashboardCard>
        <DashboardCard to="/users" title="Users">
          <IconUsers {...cardIconProps} />
        </DashboardCard>
        <DashboardCard to="/telegram/tasks" title="Telegram Tasks">
          <IconSend {...cardIconProps} />
        </DashboardCard>
        <DashboardCard to="/telegram/mirrors" title="Telegram Mirrors">
          <IconCopy {...cardIconProps} />
        </DashboardCard>
        <DashboardCard to="/pending-attachments" title="Pending Attachments">
          <IconPaperclip {...cardIconProps} />
        </DashboardCard>
      </SimpleGrid>
    </Stack>
  )
}

interface DashboardCardProps {
  to: string
  title: string
  children: ReactNode
}

/** Clickable dashboard card with icon */
function DashboardCard({ to, title, children }: DashboardCardProps) {
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
          {children}
          <Text fw={500} size="lg">
            {title}
          </Text>
        </Stack>
      </Paper>
    </UnstyledButton>
  )
}

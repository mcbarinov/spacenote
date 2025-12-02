import { Group, Title } from "@mantine/core"
import { LinkButton } from "../navigation/LinkButton"

export interface PageHeaderNavItem {
  label: string
  to: string
  params?: Record<string, string>
}

interface PageHeaderProps {
  title: string
  nav?: PageHeaderNavItem[]
}

/** Page header with title and optional navigation links */
export function PageHeader({ title, nav }: PageHeaderProps) {
  if (!nav || nav.length === 0) {
    return <Title order={1}>{title}</Title>
  }

  return (
    <Group justify="space-between">
      <Title order={1}>{title}</Title>
      <Group gap="xs">
        {nav.map((item) => (
          <LinkButton key={item.to} to={item.to} params={item.params} variant="light">
            {item.label}
          </LinkButton>
        ))}
      </Group>
    </Group>
  )
}

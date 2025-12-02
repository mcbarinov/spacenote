import type { ReactNode } from "react"
import { Group, Title } from "@mantine/core"
import { LinkButton } from "../navigation/LinkButton"

export interface PageHeaderNavItem {
  label: string
  to: string
  params?: Record<string, string>
}

interface PageHeaderProps {
  title: string
  /** Custom elements (Select, etc) */
  actions?: ReactNode
  /** Navigation links */
  nav?: PageHeaderNavItem[]
}

/** Page header with title, optional custom actions, and navigation links */
export function PageHeader({ title, actions, nav }: PageHeaderProps) {
  const hasRightContent = actions ?? (nav && nav.length > 0)

  if (!hasRightContent) {
    return <Title order={1}>{title}</Title>
  }

  return (
    <Group justify="space-between">
      <Title order={1}>{title}</Title>
      <Group gap="xs">
        {actions}
        {nav?.map((item) => (
          <LinkButton key={item.to} to={item.to} params={item.params} variant="light">
            {item.label}
          </LinkButton>
        ))}
      </Group>
    </Group>
  )
}

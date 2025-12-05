import type { ReactNode } from "react"
import { Breadcrumbs, Group, Stack, Title } from "@mantine/core"
import { CustomLink } from "../navigation/CustomLink"

export interface BreadcrumbItem {
  label: string
  to?: string
  params?: Record<string, string>
}

interface PageHeaderNewProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  /** Right side of row 1 (tabs, navigation, etc) */
  topActions?: ReactNode
  /** Right side of row 2 (buttons, selects, etc) */
  actions?: ReactNode
}

/** Unified page header with optional breadcrumbs, tabs, and actions */
export function PageHeaderNew({ title, breadcrumbs, topActions, actions }: PageHeaderNewProps) {
  const hasTopRow = breadcrumbs ?? topActions

  return (
    <Stack gap="xs" mb="md">
      {hasTopRow && (
        <Group justify="space-between">
          {breadcrumbs ? (
            <Breadcrumbs>
              {breadcrumbs.map((item) =>
                item.to ? (
                  <CustomLink key={item.label} to={item.to} params={item.params} underline="hover" c="blue">
                    {item.label}
                  </CustomLink>
                ) : (
                  <span key={item.label}>{item.label}</span>
                )
              )}
            </Breadcrumbs>
          ) : (
            <div />
          )}
          {topActions}
        </Group>
      )}
      {actions ? (
        <Group justify="space-between">
          <Title order={1}>{title}</Title>
          {actions}
        </Group>
      ) : (
        <Title order={1}>{title}</Title>
      )}
    </Stack>
  )
}

import type { ReactNode } from "react"
import { Breadcrumbs, Group, Stack, Title } from "@mantine/core"
import { CustomLink } from "../navigation/CustomLink"

export interface BreadcrumbItem {
  label: string
  to?: string
  params?: Record<string, string>
}

interface NewPageHeaderProps {
  title?: string
  breadcrumbs?: BreadcrumbItem[]
  topActions?: ReactNode
  bottomActions?: ReactNode
}

/** Page header with optional title, breadcrumbs, and action slots */
export function NewPageHeader({ title, breadcrumbs, topActions, bottomActions }: NewPageHeaderProps) {
  const hasTopRow = Boolean(breadcrumbs?.length) || Boolean(topActions)
  const hasBottomRow = Boolean(title) || Boolean(bottomActions)

  return (
    <Stack gap="xs" mb="md">
      {hasTopRow && (
        <Group justify={breadcrumbs?.length ? "space-between" : "flex-start"}>
          {breadcrumbs && (
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
          )}
          {topActions}
        </Group>
      )}
      {hasBottomRow && (
        <Group justify={title ? "space-between" : "flex-start"}>
          {title && <Title order={3}>{title}</Title>}
          {bottomActions}
        </Group>
      )}
    </Stack>
  )
}

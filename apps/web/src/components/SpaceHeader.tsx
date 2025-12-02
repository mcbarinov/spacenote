import type { ReactNode } from "react"
import { Breadcrumbs, Button, Group, Stack, Text } from "@mantine/core"
import { CustomLink, PageHeader, SpaceSlug, type PageHeaderNavItem } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"
import { useLocation, useNavigate } from "@tanstack/react-router"

interface SpaceHeaderProps {
  title: string
  space: Space
  /** For note-level pages - adds note to breadcrumbs */
  note?: { number: number }
  /** Custom elements (Select, etc) */
  actions?: ReactNode
  /** Navigation links */
  nav?: PageHeaderNavItem[]
}

/** Page header with breadcrumbs and navigation tabs */
export function SpaceHeader({ title, space, note, actions, nav }: SpaceHeaderProps) {
  return (
    <Stack gap="xs" mb="md">
      <Group justify="space-between">
        <Breadcrumbs>
          <CustomLink to="/" underline="hover" c="blue">
            Home
          </CustomLink>
          {note ? (
            <CustomLink to="/s/$slug" params={{ slug: space.slug }} underline="hover" c="blue">
              <SpaceSlug slug={space.slug} />
            </CustomLink>
          ) : (
            <SpaceSlug slug={space.slug} />
          )}
          {note && <Text size="sm">Note #{note.number}</Text>}
        </Breadcrumbs>
        <SpaceTabs slug={space.slug} note={note} />
      </Group>
      <PageHeader title={title} actions={actions} nav={nav} />
    </Stack>
  )
}

/** Navigation tabs for switching between notes and attachments views */
function SpaceTabs({ slug, note }: { slug: string; note?: { number: number } }) {
  const location = useLocation()
  const navigate = useNavigate()

  if (note) {
    // Note-level pages: Notes | Note Attachments
    const noteNumber = String(note.number)
    const isNoteAttachments = location.pathname.includes(`/${noteNumber}/attachments`)
    return (
      <Group gap="xs">
        <Button
          variant={!isNoteAttachments ? "light" : "subtle"}
          size="xs"
          onClick={() => void navigate({ to: "/s/$slug/$noteNumber", params: { slug, noteNumber } })}
        >
          Notes
        </Button>
        <Button
          variant={isNoteAttachments ? "light" : "subtle"}
          size="xs"
          onClick={() => void navigate({ to: "/s/$slug/$noteNumber/attachments", params: { slug, noteNumber } })}
        >
          Note Attachments
        </Button>
      </Group>
    )
  }

  // Space-level pages: Notes | Space Attachments
  // Check both exact match and prefix to handle /attachments/new and similar routes
  const isSpaceAttachments =
    location.pathname === `/s/${slug}/attachments` || location.pathname.startsWith(`/s/${slug}/attachments/`)

  return (
    <Group gap="xs">
      <Button
        variant={!isSpaceAttachments ? "light" : "subtle"}
        size="xs"
        onClick={() => void navigate({ to: "/s/$slug", params: { slug } })}
      >
        Notes
      </Button>
      <Button
        variant={isSpaceAttachments ? "light" : "subtle"}
        size="xs"
        onClick={() => void navigate({ to: "/s/$slug/attachments", params: { slug } })}
      >
        Space Attachments
      </Button>
    </Group>
  )
}

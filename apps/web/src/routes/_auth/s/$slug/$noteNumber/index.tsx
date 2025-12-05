import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router"
import { Button, Divider, Group, Title } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { api, COMMENTS_PAGE_LIMIT } from "@spacenote/common/api"
import { PageHeaderNew } from "@spacenote/common/components"
import { CommentForm } from "./-components/CommentForm"
import { CommentList } from "./-components/CommentList"
import { NoteDetailsDefault } from "./-components/NoteDetailsDefault"
import { NoteDetailsJson } from "./-components/NoteDetailsJson"
import { NoteDetailsTemplate } from "./-components/NoteDetailsTemplate"
import { ViewModeMenu } from "./-components/ViewModeMenu"

const searchSchema = z.object({
  view: z.enum(["default", "template", "json"]).optional(),
})

type ViewMode = "default" | "template" | "json"

/** Resolves which view mode to display */
function resolveView(view: ViewMode | undefined, hasTemplate: boolean): ViewMode {
  if (view === "json") return "json"
  if (view === "template" && hasTemplate) return "template"
  if (view === "default") return "default"
  // No view specified - use template if available
  return hasTemplate ? "template" : "default"
}

export const Route = createFileRoute("/_auth/s/$slug/$noteNumber/")({
  validateSearch: searchSchema,
  loader: async ({ context, params }) => {
    const noteNumber = Number(params.noteNumber)
    await Promise.all([
      context.queryClient.ensureQueryData(api.queries.getNote(params.slug, noteNumber)),
      context.queryClient.ensureQueryData(api.queries.listComments(params.slug, noteNumber, 1, COMMENTS_PAGE_LIMIT)),
    ])
  },
  component: NoteDetailPage,
})

/** Note detail page with fields and comments */
function NoteDetailPage() {
  const { slug, noteNumber } = Route.useParams()
  const { view } = Route.useSearch()
  const location = useLocation()
  const navigate = useNavigate()
  const noteNum = Number(noteNumber)
  const space = api.cache.useSpace(slug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(slug, noteNum))

  const template = space.templates["web:note:detail"]
  const hasTemplate = Boolean(template)
  const resolvedView = resolveView(view, hasTemplate)

  // Tab state
  const isNoteAttachments = location.pathname.includes(`/${noteNumber}/attachments`)
  const isEdit = location.pathname.includes(`/${noteNumber}/edit`)

  return (
    <>
      <PageHeaderNew
        title={`Note #${String(note.number)}`}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
          { label: `Note #${String(note.number)}` },
        ]}
        topActions={
          <Group gap="xs">
            <Button
              variant={!isNoteAttachments && !isEdit ? "light" : "subtle"}
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
            <Button
              variant={isEdit ? "light" : "subtle"}
              size="xs"
              onClick={() => void navigate({ to: "/s/$slug/$noteNumber/edit", params: { slug, noteNumber } })}
            >
              Edit
            </Button>
          </Group>
        }
        actions={<ViewModeMenu slug={slug} noteNumber={noteNumber} currentView={resolvedView} hasTemplate={hasTemplate} />}
      />

      {resolvedView === "json" && <NoteDetailsJson note={note} />}
      {resolvedView === "template" && template && <NoteDetailsTemplate note={note} space={space} template={template} />}
      {resolvedView === "default" && <NoteDetailsDefault note={note} space={space} />}

      <Divider my="lg" />

      <Title order={2} mb="md">
        Comments
      </Title>
      <CommentForm spaceSlug={slug} noteNumber={noteNum} />
      <Divider my="lg" />
      <CommentList spaceSlug={slug} noteNumber={noteNum} />
    </>
  )
}

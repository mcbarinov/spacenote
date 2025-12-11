import { createFileRoute } from "@tanstack/react-router"
import { Divider, Group, Title } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { api, COMMENTS_PAGE_LIMIT } from "@spacenote/common/api"
import { LinkButton, NavigationTabs, PageHeader } from "@spacenote/common/components"
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
  const noteNum = Number(noteNumber)
  const space = api.cache.useSpace(slug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(slug, noteNum))

  const template = space.templates["web:note:detail"]
  const hasTemplate = Boolean(template)
  const resolvedView = resolveView(view, hasTemplate)

  return (
    <>
      <PageHeader
        title={note.title}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: `◈ ${space.slug}`, to: "/s/$slug", params: { slug } },
          { label: `Note #${String(note.number)}` },
        ]}
        topActions={
          <Group gap="sm">
            <NavigationTabs
              tabs={[
                { label: "Note", to: "/s/$slug/$noteNumber", params: { slug, noteNumber } },
                { label: "Attachments", to: "/s/$slug/$noteNumber/attachments", params: { slug, noteNumber } },
              ]}
            />
            <ViewModeMenu slug={slug} noteNumber={noteNumber} currentView={resolvedView} hasTemplate={hasTemplate} />
            <LinkButton to="/s/$slug/$noteNumber/edit" params={{ slug, noteNumber }}>
              Edit
            </LinkButton>
          </Group>
        }
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

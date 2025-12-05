import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router"
import { Button, Group, Select } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@spacenote/common/api"
import { LinkButton, PageHeader } from "@spacenote/common/components"
import { z } from "zod"
import { NotesListDefault } from "./-components/NotesListDefault"
import { NotesListJson } from "./-components/NotesListJson"
import { NotesListTemplate } from "./-components/NotesListTemplate"
import { ViewModeMenu } from "./-components/ViewModeMenu"

const searchSchema = z.object({
  filter: z.string().optional(),
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

export const Route = createFileRoute("/_auth/s/$slug/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ filter: search.filter }),
  loader: async ({ context, params, deps }) => {
    await context.queryClient.ensureQueryData(api.queries.listNotes(params.slug, deps.filter))
  },
  component: SpacePage,
})

/** Space page with notes list */
function SpacePage() {
  const { slug } = Route.useParams()
  const { filter, view } = Route.useSearch()
  const location = useLocation()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(slug, filter))

  // Template key: web:note:list:{filter}, defaults to "all" when no filter selected
  const filterName = filter ?? "all"
  const templateKey = `web:note:list:${filterName}`
  const template = space.templates[templateKey]
  const hasTemplate = Boolean(template)
  const resolvedView = resolveView(view, hasTemplate)

  // Column priority: selected filter > "all" filter > hardcoded defaults
  const selectedFilter = filter ? space.filters.find((f) => f.name === filter) : undefined
  const allFilter = space.filters.find((f) => f.name === "all")
  const displayFields = selectedFilter?.notes_list_default_columns.length
    ? selectedFilter.notes_list_default_columns
    : allFilter?.notes_list_default_columns.length
      ? allFilter.notes_list_default_columns
      : ["note.number", "note.created_at", "note.author"]

  // Tab state
  const isSpaceAttachments =
    location.pathname === `/s/${slug}/attachments` || location.pathname.startsWith(`/s/${slug}/attachments/`)

  return (
    <>
      <PageHeader
        title={space.title}
        breadcrumbs={[{ label: "Home", to: "/" }, { label: `◈ ${space.slug}` }]}
        topActions={
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
        }
        actions={
          <Group gap="xs">
            {space.filters.length > 0 && (
              <Select
                placeholder="All notes"
                clearable
                data={space.filters.map((f) => ({ value: f.name, label: f.name }))}
                value={filter ?? null}
                onChange={(value) =>
                  void navigate({
                    to: "/s/$slug",
                    params: { slug },
                    search: value ? { filter: value, view } : { view },
                  })
                }
              />
            )}
            <ViewModeMenu slug={slug} filter={filter} currentView={resolvedView} hasTemplate={hasTemplate} />
            <LinkButton to="/s/$slug/new" params={{ slug }} variant="light">
              New Note
            </LinkButton>
          </Group>
        }
      />

      {resolvedView === "json" && <NotesListJson notes={notesList.items} />}
      {resolvedView === "template" && template && <NotesListTemplate notes={notesList.items} space={space} template={template} />}
      {resolvedView === "default" && <NotesListDefault notes={notesList.items} space={space} displayFields={displayFields} />}
    </>
  )
}

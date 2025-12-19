import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ActionIcon, Group, Select } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { IconFilter, IconPaperclip } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import { LinkButton, NewPageHeader } from "@spacenote/common/components"
import { z } from "zod"
import { useState } from "react"
import { NotesListDefault } from "./-components/NotesListDefault"
import { NotesListJson } from "./-components/NotesListJson"
import { NotesListTemplate } from "./-components/NotesListTemplate"
import { ViewModeMenu } from "@/components/ViewModeMenu"
import { ActiveQueryFilters } from "./-components/ActiveQueryFilters"
import { AdhocFilterDrawer } from "./-components/AdhocFilterDrawer"

const searchSchema = z.object({
  filter: z.string().optional(),
  view: z.enum(["default", "template", "json"]).optional(),
  q: z.string().optional(),
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

/** Gets template with fallback: filter-specific → all → undefined */
function getListTemplate(templates: Record<string, string>, filterName: string): string | undefined {
  return templates[`web:note:list:${filterName}`] ?? templates["web:note:list:all"]
}

export const Route = createFileRoute("/_auth/s/$slug/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ filter: search.filter, q: search.q }),
  loader: async ({ context, params, deps }) => {
    await context.queryClient.ensureQueryData(api.queries.listNotes(params.slug, deps.filter, deps.q))
  },
  component: SpacePage,
})

/** Space page with notes list */
function SpacePage() {
  const { slug } = Route.useParams()
  const { filter, view, q } = Route.useSearch()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const { data: notesList } = useSuspenseQuery(api.queries.listNotes(slug, filter, q))
  const [adhocFilterOpened, setAdhocFilterOpened] = useState(false)

  const filterName = filter ?? "all"
  const template = getListTemplate(space.templates, filterName)
  const hasTemplate = Boolean(template)
  const resolvedView = resolveView(view, hasTemplate)

  // Column priority: selected filter > "all" filter > hardcoded defaults
  const selectedFilter = filter ? space.filters.find((f) => f.name === filter) : undefined
  const allFilter = space.filters.find((f) => f.name === "all")
  const displayFields = selectedFilter?.default_columns.length
    ? selectedFilter.default_columns
    : allFilter?.default_columns.length
      ? allFilter.default_columns
      : ["note.number", "note.created_at", "note.author"]

  return (
    <>
      <NewPageHeader
        breadcrumbs={[{ label: `◈ ${space.slug}`, to: "/" }, { label: "Notes" }]}
        topActions={
          <LinkButton to="/s/$slug/new" params={{ slug }} variant="light">
            New Note
          </LinkButton>
        }
        bottomActions={
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
            <ActionIcon
              variant="subtle"
              onClick={() => {
                setAdhocFilterOpened(true)
              }}
              title="Adhoc Filter"
            >
              <IconFilter size={18} />
            </ActionIcon>
            <ViewModeMenu slug={slug} filter={filter} currentView={resolvedView} hasTemplate={hasTemplate} />
            <Link to="/s/$slug/attachments" params={{ slug }}>
              <ActionIcon variant="subtle" title="Attachments">
                <IconPaperclip size={18} />
              </ActionIcon>
            </Link>
          </Group>
        }
      />

      <ActiveQueryFilters q={q} slug={slug} />

      {resolvedView === "json" && <NotesListJson notes={notesList.items} />}
      {resolvedView === "template" && template && (
        <NotesListTemplate notes={notesList.items} space={space} template={template} q={q} filter={filter} />
      )}
      {resolvedView === "default" && <NotesListDefault notes={notesList.items} space={space} displayFields={displayFields} />}

      <AdhocFilterDrawer
        key={q}
        opened={adhocFilterOpened}
        onClose={() => {
          setAdhocFilterOpened(false)
        }}
        space={space}
        q={q}
        filter={filter}
        view={view}
      />
    </>
  )
}

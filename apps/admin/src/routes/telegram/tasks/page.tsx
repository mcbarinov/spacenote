import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Group, Select, Stack } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import { TELEGRAM_TASK_STATUSES, TELEGRAM_TASK_TYPES } from "@spacenote/common/types"
import { TelegramTasksTable } from "./-local/TelegramTasksTable"

const searchSchema = z.object({
  space_slug: z.string().optional(),
  task_type: z
    .enum(["activity_note_created", "activity_note_updated", "activity_comment_created", "mirror_create", "mirror_update"])
    .optional(),
  status: z.enum(["pending", "completed", "failed"]).optional(),
})

export const Route = createFileRoute("/_auth.layout/telegram/tasks")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(api.queries.listTelegramTasks(deps))
  },
  component: TelegramTasksPage,
})

/** Admin page for viewing telegram task history */
function TelegramTasksPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()
  const spaces = api.cache.useSpaces()

  const { data } = useSuspenseQuery(api.queries.listTelegramTasks(search))

  /** Updates search params when filter changes */
  function handleFilterChange(key: keyof typeof search, value: string | null) {
    void navigate({
      search: (prev) => ({
        ...prev,
        [key]: value ?? undefined,
      }),
    })
  }

  return (
    <Stack gap="md">
      <PageHeader breadcrumbs={[{ label: "Telegram Tasks" }]} />

      <Group>
        <Select
          placeholder="All spaces"
          clearable
          data={spaces.map((s) => ({ value: s.slug, label: s.title }))}
          value={search.space_slug ?? null}
          onChange={(value) => {
            handleFilterChange("space_slug", value)
          }}
          w={200}
        />
        <Select
          placeholder="All types"
          clearable
          data={TELEGRAM_TASK_TYPES.map((t) => ({ value: t, label: t }))}
          value={search.task_type ?? null}
          onChange={(value) => {
            handleFilterChange("task_type", value)
          }}
          w={200}
        />
        <Select
          placeholder="All statuses"
          clearable
          data={TELEGRAM_TASK_STATUSES.map((s) => ({ value: s, label: s }))}
          value={search.status ?? null}
          onChange={(value) => {
            handleFilterChange("status", value)
          }}
          w={150}
        />
      </Group>

      <TelegramTasksTable tasks={data.items} />
    </Stack>
  )
}

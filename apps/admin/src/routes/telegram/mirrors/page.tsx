import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Group, Select, Stack } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import { TelegramMirrorsTable } from "./-components/TelegramMirrorsTable"

const searchSchema = z.object({
  space_slug: z.string().optional(),
})

export const Route = createFileRoute("/_auth.layout/telegram/mirrors")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(api.queries.listTelegramMirrors(deps))
  },
  component: TelegramMirrorsPage,
})

/** Admin page for viewing telegram mirrors */
function TelegramMirrorsPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()
  const spaces = api.cache.useSpaces()

  const { data } = useSuspenseQuery(api.queries.listTelegramMirrors(search))

  /** Updates search params when filter changes */
  function handleFilterChange(value: string | null) {
    void navigate({
      search: (prev) => ({
        ...prev,
        space_slug: value ?? undefined,
      }),
    })
  }

  return (
    <Stack gap="md">
      <PageHeader breadcrumbs={[{ to: "/", label: "Admin Dashboard" }, { label: "Telegram Mirrors" }]} />

      <Group>
        <Select
          placeholder="All spaces"
          clearable
          data={spaces.map((s) => ({ value: s.slug, label: s.title }))}
          value={search.space_slug ?? null}
          onChange={handleFilterChange}
          w={200}
        />
      </Group>

      <TelegramMirrorsTable mirrors={data.items} />
    </Stack>
  )
}

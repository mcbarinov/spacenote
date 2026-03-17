import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Group, Select, Stack } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { TelegramMirrorsTable } from "./-local/TelegramMirrorsTable"

const searchSchema = z.object({
  space_slug: z.string().optional(),
})

export const Route = createFileRoute("/_auth/_admin/admin/telegram/mirrors")({
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

  return (
    <Stack gap="md">
      <PageHeader breadcrumbs={[{ label: "Telegram Mirrors" }]} />

      <Group>
        <Select
          placeholder="All spaces"
          clearable
          data={spaces.map((s) => ({ value: s.slug, label: s.title }))}
          value={search.space_slug ?? null}
          onChange={(value) => {
            void navigate({
              search: (prev) => ({
                ...prev,
                space_slug: value ?? undefined,
              }),
            })
          }}
          w={200}
        />
      </Group>

      <TelegramMirrorsTable mirrors={data.items} />
    </Stack>
  )
}

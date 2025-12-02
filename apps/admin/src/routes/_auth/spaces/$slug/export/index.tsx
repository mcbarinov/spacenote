import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Button, Checkbox, CopyButton, Group, Paper, Stack, Textarea } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { SpaceHeader } from "@/components/SpaceHeader"

export const Route = createFileRoute("/_auth/spaces/$slug/export/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(api.queries.exportSpace(params.slug, false))
  },
  component: ExportPage,
})

/** Space export page with JSON preview and copy functionality */
function ExportPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const [includeData, setIncludeData] = useState(false)

  const { data } = useSuspenseQuery(api.queries.exportSpace(slug, includeData))

  const jsonString = JSON.stringify(data, null, 2)

  return (
    <Stack gap="md">
      <SpaceHeader space={space} title="Export" />
      <Paper withBorder p="md">
        <Stack gap="md">
          <Checkbox
            label="Include data (notes, comments, attachments)"
            checked={includeData}
            onChange={(e) => {
              setIncludeData(e.currentTarget.checked)
            }}
          />
          <Textarea
            value={jsonString}
            readOnly
            autosize
            minRows={10}
            maxRows={30}
            styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
          />
          <Group justify="flex-end">
            <CopyButton value={jsonString}>
              {({ copied, copy }) => <Button onClick={copy}>{copied ? "Copied" : "Copy"}</Button>}
            </CopyButton>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}

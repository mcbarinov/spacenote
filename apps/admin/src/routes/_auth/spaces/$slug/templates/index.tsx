import { Paper, Stack, Tabs } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { createFileRoute } from "@tanstack/react-router"
import { SpaceHeader } from "@/components/SpaceHeader"
import { NoteDetailPlayground } from "./-components/NoteDetailPlayground"
import { NoteDetailTemplateEditor } from "./-components/NoteDetailTemplateEditor"
import { NoteListPlayground } from "./-components/NoteListPlayground"
import { NoteListTemplateEditor } from "./-components/NoteListTemplateEditor"

export const Route = createFileRoute("/_auth/spaces/$slug/templates/")({
  component: TemplatesPage,
})

/** Templates editor page with tabs for note detail and note list templates */
function TemplatesPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <SpaceHeader space={space} title="Templates" />
      <Paper withBorder p="md">
        <Tabs defaultValue="detail">
          <Tabs.List>
            <Tabs.Tab value="detail">Note Detail</Tabs.Tab>
            <Tabs.Tab value="list">Note List</Tabs.Tab>
            <Tabs.Tab value="playground-detail">Playground: Detail</Tabs.Tab>
            <Tabs.Tab value="playground-list">Playground: List</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="detail" pt="md">
            <NoteDetailTemplateEditor spaceSlug={slug} currentContent={space.templates["web:note:detail"] ?? ""} />
          </Tabs.Panel>

          <Tabs.Panel value="list" pt="md">
            <NoteListTemplateEditor spaceSlug={slug} filters={space.filters.map((f) => f.name)} templates={space.templates} />
          </Tabs.Panel>

          <Tabs.Panel value="playground-detail" pt="md">
            <NoteDetailPlayground spaceSlug={slug} />
          </Tabs.Panel>

          <Tabs.Panel value="playground-list" pt="md">
            <NoteListPlayground spaceSlug={slug} filters={space.filters.map((f) => f.name)} />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  )
}

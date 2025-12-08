import { Paper, Stack, Tabs } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import { createFileRoute } from "@tanstack/react-router"
import { SpaceTabs } from "@/components/SpaceTabs"
import { NoteDetailPlayground } from "./-components/NoteDetailPlayground"
import { NoteDetailTemplateEditor } from "./-components/NoteDetailTemplateEditor"
import { NoteListPlayground } from "./-components/NoteListPlayground"
import { NoteListTemplateEditor } from "./-components/NoteListTemplateEditor"
import { NoteTitleTemplateEditor } from "./-components/NoteTitleTemplateEditor"

export const Route = createFileRoute("/_auth/spaces/$slug/templates/")({
  component: TemplatesPage,
})

/** Templates editor page with two-level tabs: Liquid Templates / Mantine Playground */
function TemplatesPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <PageHeader
        title="Templates"
        breadcrumbs={[{ label: "Spaces", to: "/spaces" }, { label: `◈ ${space.slug}` }]}
        topActions={<SpaceTabs space={space} />}
      />
      <Paper withBorder p="md">
        <Tabs defaultValue="liquid">
          <Tabs.List>
            <Tabs.Tab value="liquid">Liquid Templates</Tabs.Tab>
            <Tabs.Tab value="playground">Mantine Playground</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="liquid" pt="md">
            <Tabs defaultValue="title">
              <Tabs.List>
                <Tabs.Tab value="title">Note Title</Tabs.Tab>
                <Tabs.Tab value="detail">Note Detail</Tabs.Tab>
                <Tabs.Tab value="list">Note List</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="title" pt="md">
                <NoteTitleTemplateEditor spaceSlug={slug} currentContent={space.templates["note:title"] ?? ""} />
              </Tabs.Panel>
              <Tabs.Panel value="detail" pt="md">
                <NoteDetailTemplateEditor spaceSlug={slug} currentContent={space.templates["web:note:detail"] ?? ""} />
              </Tabs.Panel>
              <Tabs.Panel value="list" pt="md">
                <NoteListTemplateEditor spaceSlug={slug} filters={space.filters.map((f) => f.name)} templates={space.templates} />
              </Tabs.Panel>
            </Tabs>
          </Tabs.Panel>

          <Tabs.Panel value="playground" pt="md">
            <Tabs defaultValue="detail">
              <Tabs.List>
                <Tabs.Tab value="detail">Note Detail</Tabs.Tab>
                <Tabs.Tab value="list">Note List</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="detail" pt="md">
                <NoteDetailPlayground spaceSlug={slug} />
              </Tabs.Panel>
              <Tabs.Panel value="list" pt="md">
                <NoteListPlayground spaceSlug={slug} filters={space.filters.map((f) => f.name)} />
              </Tabs.Panel>
            </Tabs>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  )
}

import { Paper, Stack, Tabs } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import { createFileRoute } from "@tanstack/react-router"
import { SpaceTabs } from "@/components/SpaceTabs"
import { NoteDetailReactTemplate } from "./-components/NoteDetailReactTemplate"
import { NoteDetailTemplate } from "./-components/NoteDetailTemplate"
import { NoteListReactTemplate } from "./-components/NoteListReactTemplate"
import { NoteListTemplate } from "./-components/NoteListTemplate"
import { NoteTitleTemplate } from "./-components/NoteTitleTemplate"

export const Route = createFileRoute("/_auth/spaces/$slug/templates/")({
  component: TemplatesPage,
})

/** Templates editor page with two-level tabs: Liquid Templates / React Templates */
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
            <Tabs.Tab value="react">React Templates</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="liquid" pt="md">
            <Tabs defaultValue="title">
              <Tabs.List>
                <Tabs.Tab value="title">Note Title</Tabs.Tab>
                <Tabs.Tab value="detail">Note Detail</Tabs.Tab>
                <Tabs.Tab value="list">Note List</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="title" pt="md">
                <NoteTitleTemplate spaceSlug={slug} currentContent={space.templates["note:title"] ?? ""} />
              </Tabs.Panel>
              <Tabs.Panel value="detail" pt="md">
                <NoteDetailTemplate spaceSlug={slug} currentContent={space.templates["web:note:detail"] ?? ""} />
              </Tabs.Panel>
              <Tabs.Panel value="list" pt="md">
                <NoteListTemplate spaceSlug={slug} filters={space.filters.map((f) => f.name)} templates={space.templates} />
              </Tabs.Panel>
            </Tabs>
          </Tabs.Panel>

          <Tabs.Panel value="react" pt="md">
            <Tabs defaultValue="detail">
              <Tabs.List>
                <Tabs.Tab value="detail">Note Detail</Tabs.Tab>
                <Tabs.Tab value="list">Note List</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="detail" pt="md">
                <NoteDetailReactTemplate spaceSlug={slug} currentContent={space.templates["web_react:note:detail"] ?? ""} />
              </Tabs.Panel>
              <Tabs.Panel value="list" pt="md">
                <NoteListReactTemplate spaceSlug={slug} filters={space.filters.map((f) => f.name)} templates={space.templates} />
              </Tabs.Panel>
            </Tabs>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  )
}

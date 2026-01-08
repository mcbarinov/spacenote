import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { LinkButton, PageHeader } from "@spacenote/common/components"
import { SpaceTabs } from "@/components/SpaceTabs"
import { FieldsTable } from "./-local/FieldsTable"

export const Route = createFileRoute("/_auth/spaces/$slug/fields/")({
  component: FieldsPage,
})

/** Space fields list with add field button */
function FieldsPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces", to: "/spaces" }, { label: `◈ ${space.slug}` }, { label: "Fields" }]}
        topActions={
          <>
            <SpaceTabs space={space} />
            <LinkButton to="/spaces/$slug/fields/new" params={{ slug }}>
              Add Field
            </LinkButton>
          </>
        }
      />
      <FieldsTable spaceSlug={slug} fields={space.fields} />
    </Stack>
  )
}

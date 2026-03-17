import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@/api"
import { LinkButton } from "@/components/LinkButton"
import { PageHeader } from "@/components/PageHeader"
import { SpaceTabs } from "@/routes/admin/spaces/-shared/SpaceTabs"
import { FieldsTable } from "./-local/FieldsTable"

export const Route = createFileRoute("/_auth/_admin/admin/spaces/$slug/fields/")({
  component: FieldsPage,
})

/** Space fields list with add field button */
function FieldsPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces", to: "/admin/spaces" }, { label: `◈ ${space.slug}` }, { label: "Fields" }]}
        topActions={
          <>
            <SpaceTabs space={space} />
            <LinkButton to="/admin/spaces/$slug/fields/new" params={{ slug }}>
              Add Field
            </LinkButton>
          </>
        }
      />
      <FieldsTable spaceSlug={slug} fields={space.fields} />
    </Stack>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { LinkButton } from "@spacenote/common/components"
import { SpaceHeader } from "@/components/SpaceHeader"
import { FieldsTable } from "./-components/FieldsTable"

export const Route = createFileRoute("/_auth/spaces/$slug/fields/")({
  component: FieldsPage,
})

function FieldsPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <SpaceHeader
        space={space}
        title="Fields"
        actions={
          <LinkButton to="/spaces/$slug/fields/new" params={{ slug }}>
            Add Field
          </LinkButton>
        }
      />

      <FieldsTable spaceSlug={slug} fields={space.fields} />
    </Stack>
  )
}

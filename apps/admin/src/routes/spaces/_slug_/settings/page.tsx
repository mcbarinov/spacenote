import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import { SpaceTabs } from "@/components/SpaceTabs"
import { DeleteSpace } from "./-components/DeleteSpace"
import { EditDefaultFilter } from "./-components/EditDefaultFilter"
import { EditDescription } from "./-components/EditDescription"
import { EditEditableFieldsOnComment } from "./-components/EditEditableFieldsOnComment"
import { EditHiddenFieldsOnCreate } from "./-components/EditHiddenFieldsOnCreate"
import { EditTelegram } from "./-components/EditTelegram"
import { EditTitle } from "./-components/EditTitle"

export const Route = createFileRoute("/_auth.layout/spaces/$slug/settings")({
  component: SettingsPage,
})

/** Space settings page with title, description, and danger zone */
function SettingsPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces", to: "/spaces" }, { label: `◈ ${space.slug}` }, { label: "Settings" }]}
        topActions={<SpaceTabs space={space} />}
      />
      <EditTitle space={space} />
      <EditDescription space={space} />
      <EditDefaultFilter space={space} />
      <EditHiddenFieldsOnCreate space={space} />
      <EditEditableFieldsOnComment space={space} />
      <EditTelegram space={space} />
      <DeleteSpace space={space} />
    </Stack>
  )
}

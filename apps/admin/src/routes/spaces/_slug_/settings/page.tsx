import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { PageHeader } from "@spacenote/common/components"
import { SpaceTabs } from "@/components/SpaceTabs"
import { DeleteSpace } from "./-local/DeleteSpace"
import { EditDefaultFilter } from "./-local/EditDefaultFilter"
import { EditDescription } from "./-local/EditDescription"
import { EditEditableFieldsOnComment } from "./-local/EditEditableFieldsOnComment"
import { EditHiddenFieldsOnCreate } from "./-local/EditHiddenFieldsOnCreate"
import { EditTelegram } from "./-local/EditTelegram"
import { EditTitle } from "./-local/EditTitle"

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

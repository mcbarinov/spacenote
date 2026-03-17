import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { SpaceTabs } from "../../-shared/SpaceTabs"
import { DeleteSpace } from "./-local/DeleteSpace"
import { EditSlug } from "./-local/EditSlug"
import { EditDefaultFilter } from "./-local/EditDefaultFilter"
import { EditDescription } from "./-local/EditDescription"
import { EditEditableFieldsOnComment } from "./-local/EditEditableFieldsOnComment"
import { EditHiddenFieldsOnCreate } from "./-local/EditHiddenFieldsOnCreate"
import { EditCanTransferTo } from "./-local/EditCanTransferTo"
import { EditTelegram } from "./-local/EditTelegram"
import { EditTitle } from "./-local/EditTitle"

export const Route = createFileRoute("/_auth/_admin/admin/spaces/$slug/settings")({
  component: SettingsPage,
})

/** Space settings page with title, description, and danger zone */
function SettingsPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces", to: "/admin/spaces" }, { label: `◈ ${space.slug}` }, { label: "Settings" }]}
        topActions={<SpaceTabs space={space} />}
      />
      <EditTitle space={space} />
      <EditDescription space={space} />
      <EditDefaultFilter space={space} />
      <EditHiddenFieldsOnCreate space={space} />
      <EditEditableFieldsOnComment space={space} />
      <EditCanTransferTo space={space} />
      <EditTelegram space={space} />
      <EditSlug space={space} />
      <DeleteSpace space={space} />
    </Stack>
  )
}

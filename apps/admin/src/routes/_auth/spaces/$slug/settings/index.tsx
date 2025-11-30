import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { api } from "@spacenote/common/api"
import { SpaceHeader } from "@/components/SpaceHeader"
import { DeleteSpace } from "./-components/DeleteSpace"
import { EditDescription } from "./-components/EditDescription"
import { EditHiddenFieldsOnCreate } from "./-components/EditHiddenFieldsOnCreate"
import { EditNotesListDefaultColumns } from "./-components/EditNotesListDefaultColumns"
import { EditTitle } from "./-components/EditTitle"

export const Route = createFileRoute("/_auth/spaces/$slug/settings/")({
  component: SettingsPage,
})

function SettingsPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <SpaceHeader slug={slug} title="Settings" />
      <EditTitle space={space} />
      <EditDescription space={space} />
      <EditHiddenFieldsOnCreate space={space} />
      <EditNotesListDefaultColumns space={space} />
      <DeleteSpace space={space} />
    </Stack>
  )
}

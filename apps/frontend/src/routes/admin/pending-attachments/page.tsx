import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { PendingAttachmentsTable } from "./-local/PendingAttachmentsTable"

export const Route = createFileRoute("/_auth/_admin/admin/pending-attachments")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(api.queries.listPendingAttachments())
  },
  component: PendingAttachmentsPage,
})

/** Admin page for viewing and managing pending attachments */
function PendingAttachmentsPage() {
  const { data } = useSuspenseQuery(api.queries.listPendingAttachments())

  return (
    <Stack gap="md">
      <PageHeader breadcrumbs={[{ label: "Pending Attachments" }]} />
      <PendingAttachmentsTable attachments={data.items} />
    </Stack>
  )
}

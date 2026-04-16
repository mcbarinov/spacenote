import { createFileRoute } from "@tanstack/react-router"
import { Button, Code, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core"
import { IconRefresh } from "@tabler/icons-react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { formatDate, formatFileSize } from "@/utils/format"

export const Route = createFileRoute("/_auth/_admin/admin/error-log")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(api.queries.getErrorLog())
  },
  component: ErrorLogPage,
})

function ErrorLogPage() {
  const { data: errorLog, refetch, isFetching } = useSuspenseQuery(api.queries.getErrorLog())

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Error Log" }]}
        topActions={
          <Group gap="xs">
            {errorLog.modified_at && (
              <Text size="sm" c="dimmed">
                {formatFileSize(errorLog.size)} · {formatDate(errorLog.modified_at)}
              </Text>
            )}
            <Button
              variant="light"
              size="xs"
              leftSection={<IconRefresh size={16} />}
              loading={isFetching}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </Group>
        }
      />
      <Paper withBorder p="md">
        <ScrollArea h="70vh">
          <Code block>{errorLog.content || "No errors recorded yet."}</Code>
        </ScrollArea>
      </Paper>
    </Stack>
  )
}

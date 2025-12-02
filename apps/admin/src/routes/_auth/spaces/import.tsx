import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Alert, Button, Group, Paper, Stack, Textarea, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { ExportData } from "@spacenote/common/types"

export const Route = createFileRoute("/_auth/spaces/import")({
  component: ImportSpacePage,
})

/** Page for importing a space from JSON export */
function ImportSpacePage() {
  const navigate = useNavigate()
  const importSpaceMutation = api.mutations.useImportSpace()
  const [jsonInput, setJsonInput] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setParseError(null)

    let data: unknown
    try {
      data = JSON.parse(jsonInput)
    } catch {
      setParseError("Invalid JSON format")
      return
    }

    // Backend will validate the structure
    importSpaceMutation.mutate(data as ExportData, {
      onSuccess: () => {
        notifications.show({
          message: "Space imported successfully",
          color: "green",
        })
        void navigate({ to: "/spaces" })
      },
    })
  }

  return (
    <Stack gap="md">
      <Title order={1}>Import Space</Title>

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Textarea
              label="JSON"
              placeholder="Paste exported space JSON here..."
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.currentTarget.value)
              }}
              autosize
              minRows={10}
              maxRows={30}
              styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
            />
            {parseError && <Alert color="red">{parseError}</Alert>}
            {importSpaceMutation.error && <ErrorMessage error={importSpaceMutation.error} />}
            <Group justify="flex-end">
              <Button type="submit" loading={importSpaceMutation.isPending}>
                Import Space
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}

import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live"
import { Stack, Paper, Divider } from "@mantine/core"

interface PlaygroundLayoutProps {
  code: string
  scope: Record<string, unknown>
}

/** Shared layout for LiveProvider playground with editor and preview */
export function PlaygroundLayout({ code, scope }: PlaygroundLayoutProps) {
  return (
    <LiveProvider code={code} scope={scope}>
      <Stack gap="md">
        <Paper withBorder p="md">
          <LiveEditor style={{ fontFamily: "monospace", fontSize: 14 }} />
        </Paper>
        <Divider label="Preview" />
        <Paper withBorder p="md">
          <LiveError />
          <LivePreview />
        </Paper>
      </Stack>
    </LiveProvider>
  )
}

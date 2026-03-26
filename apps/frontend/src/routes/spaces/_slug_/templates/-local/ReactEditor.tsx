import type { ReactNode } from "react"
import { Stack, Paper, Divider } from "@mantine/core"
import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live"

interface ReactEditorProps {
  code: string
  scope: Record<string, unknown>
  onChange: (code: string) => void
  actions?: ReactNode
}

/** Live React editor with preview */
export function ReactEditor({ code, scope, onChange, actions }: ReactEditorProps) {
  return (
    <LiveProvider code={code} scope={scope}>
      <Stack gap="md">
        <Paper withBorder p="md">
          <LiveEditor style={{ fontFamily: "monospace", fontSize: 14 }} onChange={onChange} />
        </Paper>
        {actions}
        <Divider label="Preview" />
        <Paper withBorder p="md">
          <LiveError />
          <LivePreview />
        </Paper>
      </Stack>
    </LiveProvider>
  )
}

import { Box, Input, Tabs, Textarea, Text } from "@mantine/core"
import { MarkdownDisplay } from "./MarkdownDisplay"

interface MarkdownEditorProps {
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
}

/** Markdown input with edit/preview tabs */
export function MarkdownEditor({ label, value, onChange, required, error }: MarkdownEditorProps) {
  return (
    <Input.Wrapper label={label} required={required} error={error}>
      <Tabs defaultValue="edit">
        <Tabs.List>
          <Tabs.Tab value="edit">Edit</Tabs.Tab>
          <Tabs.Tab value="preview">Preview</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="edit" pt="xs">
          <Textarea
            autosize
            minRows={3}
            value={value}
            onChange={(e) => {
              onChange(e.currentTarget.value)
            }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="preview" pt="xs">
          <Box mih={80} p="sm" style={{ border: "1px solid var(--mantine-color-default-border)", borderRadius: 4 }}>
            {value ? <MarkdownDisplay content={value} /> : <Text c="dimmed">Nothing to preview</Text>}
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Input.Wrapper>
  )
}

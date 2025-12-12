import { TextInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "../new"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options and default for markdown field type */
export function MarkdownFieldConfig({ form }: Props) {
  return <TextInput label="Default" placeholder="Optional" {...form.getInputProps("defaultString")} />
}

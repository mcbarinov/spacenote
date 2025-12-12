import { TextInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "./fieldFormUtils"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options and default for string field type */
export function StringFieldConfig({ form }: Props) {
  return <TextInput label="Default" placeholder="Optional" {...form.getInputProps("defaultString")} />
}

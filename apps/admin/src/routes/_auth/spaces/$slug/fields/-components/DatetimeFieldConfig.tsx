import { TextInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "./fieldFormUtils"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options and default for datetime field type */
export function DatetimeFieldConfig({ form }: Props) {
  return (
    <TextInput
      label="Default"
      placeholder="No default"
      description="Supported: $now, ISO datetime (2024-01-15T10:30:00Z), $exif.created_at:{image_field}|{fallback}"
      {...form.getInputProps("defaultDatetime")}
    />
  )
}

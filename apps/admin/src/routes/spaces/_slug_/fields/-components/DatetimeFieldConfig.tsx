import { Select, Stack, TextInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import { DATETIME_KINDS } from "@spacenote/common/types"
import type { FormValues } from "./fieldFormUtils"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options and default for datetime field type */
export function DatetimeFieldConfig({ form }: Props) {
  return (
    <Stack gap="sm">
      <Select label="Kind" data={[...DATETIME_KINDS]} {...form.getInputProps("datetimeKind")} />
      <TextInput
        label="Default"
        placeholder="No default"
        description="Supported: $now, ISO datetime, $exif.created_at:{image_field}|{fallback}"
        {...form.getInputProps("defaultDatetime")}
      />
    </Stack>
  )
}

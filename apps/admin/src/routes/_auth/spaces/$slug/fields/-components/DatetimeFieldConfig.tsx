import { Select, Stack, TextInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import { DATETIME_KINDS } from "@spacenote/common/types"
import type { FormValues } from "./fieldFormUtils"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options and default for datetime field type */
export function DatetimeFieldConfig({ form }: Props) {
  const kind = form.getValues().datetimeKind

  return (
    <Stack gap="sm">
      <Select label="Kind" data={[...DATETIME_KINDS]} {...form.getInputProps("datetimeKind")} />
      <TextInput
        label="Default"
        placeholder="No default"
        description={
          kind === "utc"
            ? "Supported: $now, ISO datetime (2024-01-15T10:30:00Z), $exif.created_at:{image_field}|{fallback}"
            : "Supported: $now, ISO datetime"
        }
        {...form.getInputProps("defaultDatetime")}
      />
    </Stack>
  )
}

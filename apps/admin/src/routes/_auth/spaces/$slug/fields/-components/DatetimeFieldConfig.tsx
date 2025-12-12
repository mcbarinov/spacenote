import { Select } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "./fieldFormUtils"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options and default for datetime field type */
export function DatetimeFieldConfig({ form }: Props) {
  return (
    <Select
      label="Default"
      placeholder="No default"
      data={[{ value: "$now", label: "$now (current time)" }]}
      {...form.getInputProps("defaultDatetime")}
      clearable
    />
  )
}

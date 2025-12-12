import { Select } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "../new"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options and default for boolean field type */
export function BooleanFieldConfig({ form }: Props) {
  return (
    <Select
      label="Default"
      placeholder="No default"
      data={[
        { value: "true", label: "true" },
        { value: "false", label: "false" },
      ]}
      value={form.values.defaultBoolean === null ? null : String(form.values.defaultBoolean)}
      onChange={(v) => {
        form.setFieldValue("defaultBoolean", v === null ? null : v === "true")
      }}
      clearable
    />
  )
}

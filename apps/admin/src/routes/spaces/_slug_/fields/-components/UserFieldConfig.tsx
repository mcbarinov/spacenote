import { Select } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { Space } from "@spacenote/common/types"
import type { FormValues } from "./fieldFormUtils"

interface Props {
  form: UseFormReturnType<FormValues>
  space: Space
}

/** Options and default for user field type */
export function UserFieldConfig({ form, space }: Props) {
  return (
    <Select
      label="Default"
      placeholder="No default"
      data={["$me", ...space.members]}
      {...form.getInputProps("defaultUser")}
      clearable
      searchable
    />
  )
}

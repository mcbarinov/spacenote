import { TagsInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "./fieldFormUtils"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options and default for tags field type */
export function TagsFieldConfig({ form }: Props) {
  return <TagsInput label="Default" placeholder="Enter default tags" {...form.getInputProps("defaultTags")} />
}

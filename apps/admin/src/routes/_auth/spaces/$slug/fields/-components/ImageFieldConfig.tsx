import { NumberInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "../new"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options (max_width) for image field type. No default value. */
export function ImageFieldConfig({ form }: Props) {
  return <NumberInput label="Max Width (px)" placeholder="Optional, e.g. 800" {...form.getInputProps("maxWidth")} />
}

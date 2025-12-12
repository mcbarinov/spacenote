import { Group, NumberInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "./fieldFormUtils"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options (min/max) and default for float field type */
export function FloatFieldConfig({ form }: Props) {
  return (
    <>
      <Group grow>
        <NumberInput label="Min" placeholder="Optional" {...form.getInputProps("minValue")} />
        <NumberInput label="Max" placeholder="Optional" {...form.getInputProps("maxValue")} />
      </Group>
      <NumberInput label="Default" placeholder="Optional" decimalScale={10} {...form.getInputProps("defaultFloat")} />
    </>
  )
}

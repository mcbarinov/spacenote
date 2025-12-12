import { Group, NumberInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "../new"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options (min/max) and default for int field type */
export function IntFieldConfig({ form }: Props) {
  return (
    <>
      <Group grow>
        <NumberInput label="Min" placeholder="Optional" {...form.getInputProps("minValue")} />
        <NumberInput label="Max" placeholder="Optional" {...form.getInputProps("maxValue")} />
      </Group>
      <NumberInput label="Default" placeholder="Optional" {...form.getInputProps("defaultInt")} />
    </>
  )
}

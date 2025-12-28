import { Group, NumberInput, Select, Stack } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { NumericFieldOptions } from "@spacenote/common/types"
import type { FormValues } from "./fieldFormUtils"

const NUMERIC_KINDS = ["int", "float", "decimal"] satisfies NumericFieldOptions["kind"][]

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options (kind, min/max) and default for numeric field type */
export function NumericFieldConfig({ form }: Props) {
  const allowDecimal = form.values.numericKind !== "int"

  return (
    <Stack gap="sm">
      <Select label="Format" data={NUMERIC_KINDS} {...form.getInputProps("numericKind")} />
      <Group grow>
        <NumberInput label="Min" placeholder="Optional" allowDecimal={allowDecimal} {...form.getInputProps("minValue")} />
        <NumberInput label="Max" placeholder="Optional" allowDecimal={allowDecimal} {...form.getInputProps("maxValue")} />
      </Group>
      <NumberInput label="Default" placeholder="Optional" allowDecimal={allowDecimal} {...form.getInputProps("defaultNumeric")} />
    </Stack>
  )
}

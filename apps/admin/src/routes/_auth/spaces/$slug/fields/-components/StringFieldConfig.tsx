import { Group, NumberInput, Select, Stack, TextInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import type { StringFieldOptions } from "@spacenote/common/types"
import type { FormValues } from "./fieldFormUtils"

const STRING_KINDS = ["line", "text", "markdown"] satisfies StringFieldOptions["kind"][]

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options (kind) and default for string field type */
export function StringFieldConfig({ form }: Props) {
  return (
    <Stack gap="sm">
      <Select label="Format" data={STRING_KINDS} {...form.getInputProps("stringKind")} />
      <Group grow>
        <NumberInput label="Min length" placeholder="Optional" min={0} {...form.getInputProps("minLength")} />
        <NumberInput label="Max length" placeholder="Optional" min={0} {...form.getInputProps("maxLength")} />
      </Group>
      <TextInput label="Default" placeholder="Optional" {...form.getInputProps("defaultString")} />
    </Stack>
  )
}

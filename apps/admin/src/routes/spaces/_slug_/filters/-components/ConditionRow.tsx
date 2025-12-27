import { ActionIcon, Group, Select } from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"
import type { UseFormReturnType } from "@mantine/form"
import type { SpaceField } from "@spacenote/common/types"
import { ValueInput } from "./ValueInput"
import { type ConditionValue, type FilterFormValues, getFieldDefinition, OPERATORS_BY_TYPE } from "./filterFormUtils"

interface ConditionRowProps {
  condition: ConditionValue
  index: number
  allFields: SpaceField[]
  spaceFields: SpaceField[]
  spaceMembers: string[]
  form: UseFormReturnType<FilterFormValues>
  onRemove: () => void
}

/** Single condition row with field, operator, and value inputs */
export function ConditionRow({ condition, index, allFields, spaceFields, spaceMembers, form, onRemove }: ConditionRowProps) {
  const selectedField = getFieldDefinition(condition.field, spaceFields)
  const operators = selectedField ? OPERATORS_BY_TYPE[selectedField.type] : []
  const indexStr = String(index)

  const handleFieldChange = (value: string | null) => {
    form.setFieldValue(`conditions.${indexStr}.field`, value ?? "")
    form.setFieldValue(`conditions.${indexStr}.operator`, "")
    form.setFieldValue(`conditions.${indexStr}.value`, "")
  }

  const handleOperatorChange = (value: string | null) => {
    form.setFieldValue(`conditions.${indexStr}.operator`, value ?? "")
  }

  const handleValueChange = (v: unknown) => {
    form.setFieldValue(`conditions.${indexStr}.value`, v)
  }

  return (
    <Group gap="xs" align="flex-end">
      <Select
        label="Field"
        placeholder="Select field"
        data={allFields.map((f) => f.name)}
        value={condition.field || null}
        onChange={handleFieldChange}
        style={{ flex: 1 }}
      />
      <Select
        label="Operator"
        placeholder="Select operator"
        data={operators}
        value={condition.operator || null}
        onChange={handleOperatorChange}
        disabled={!selectedField}
        style={{ flex: 1 }}
      />
      <ValueInput
        field={selectedField}
        operator={condition.operator}
        value={condition.value}
        onChange={handleValueChange}
        spaceMembers={spaceMembers}
      />
      <ActionIcon variant="subtle" color="red" onClick={onRemove}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  )
}

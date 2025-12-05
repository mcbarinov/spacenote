import { Checkbox, NumberInput, Select, TagsInput, TextInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import type { SpaceField } from "@spacenote/common/types"

interface ValueInputProps {
  field: SpaceField | undefined
  operator: string
  value: unknown
  onChange: (value: unknown) => void
  spaceMembers: string[]
}

/** Dynamic value input based on field type (text, number, date, select, etc.) */
export function ValueInput({ field, operator, value, onChange, spaceMembers }: ValueInputProps) {
  if (!field || !operator) {
    return <TextInput label="Value" placeholder="Select field and operator first" disabled style={{ flex: 1 }} />
  }

  const isArrayOperator = ["in", "nin", "all"].includes(operator)

  switch (field.type) {
    case "string":
    case "markdown":
      return (
        <TextInput
          label="Value"
          placeholder="Enter value"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
          style={{ flex: 1 }}
        />
      )

    case "boolean":
      return (
        <Checkbox
          label="Value"
          checked={value === true}
          onChange={(e) => {
            onChange(e.currentTarget.checked)
          }}
          style={{ flex: 1 }}
        />
      )

    case "int":
    case "float":
      return (
        <NumberInput
          label="Value"
          placeholder="Enter number"
          value={typeof value === "number" ? value : ""}
          onChange={(v) => {
            onChange(v)
          }}
          allowDecimal={field.type === "float"}
          style={{ flex: 1 }}
        />
      )

    case "datetime": {
      const dateValue = value instanceof Date ? value : typeof value === "string" && value ? new Date(value) : null
      return (
        <DateTimePicker
          label="Value"
          placeholder="Select date and time"
          value={dateValue}
          onChange={(date) => {
            onChange(date)
          }}
          style={{ flex: 1 }}
        />
      )
    }

    case "select": {
      const options = (field.options.values as string[] | undefined) ?? []
      if (isArrayOperator) {
        return (
          <TagsInput
            label="Values"
            placeholder="Select values"
            data={options}
            value={Array.isArray(value) ? value : []}
            onChange={(v) => {
              onChange(v)
            }}
            style={{ flex: 1 }}
          />
        )
      }
      return (
        <Select
          label="Value"
          placeholder="Select value"
          data={options}
          value={typeof value === "string" ? value : null}
          onChange={(v) => {
            onChange(v)
          }}
          style={{ flex: 1 }}
        />
      )
    }

    case "tags":
      if (isArrayOperator) {
        return (
          <TagsInput
            label="Values"
            placeholder="Enter tags"
            value={Array.isArray(value) ? value : []}
            onChange={(v) => {
              onChange(v)
            }}
            style={{ flex: 1 }}
          />
        )
      }
      return (
        <TextInput
          label="Value"
          placeholder="Enter tag"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
          style={{ flex: 1 }}
        />
      )

    case "user":
      return (
        <Select
          label="Value"
          placeholder="Select user"
          data={["$me", ...spaceMembers]}
          value={typeof value === "string" ? value : null}
          onChange={(v) => {
            onChange(v)
          }}
          searchable
          style={{ flex: 1 }}
        />
      )

    default:
      return (
        <TextInput
          label="Value"
          placeholder="Enter value"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
          style={{ flex: 1 }}
        />
      )
  }
}

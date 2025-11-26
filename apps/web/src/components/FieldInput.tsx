import { TextInput, Textarea, Checkbox, Select, NumberInput, TagsInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import type { SpaceField } from "@spacenote/common/types"

interface FieldInputProps {
  field: SpaceField
  value?: unknown
  onChange: (value: unknown) => void
  error?: string
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function asBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false
}

function asNumber(value: unknown): number | string {
  return typeof value === "number" ? value : ""
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string")
  }
  return []
}

export function FieldInput({ field, value, onChange, error }: FieldInputProps) {
  const commonProps = {
    label: field.name,
    required: field.required,
    error,
  }

  switch (field.type) {
    case "string":
      return (
        <TextInput
          {...commonProps}
          value={asString(value)}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
        />
      )

    case "markdown":
      return (
        <Textarea
          {...commonProps}
          autosize
          minRows={3}
          value={asString(value)}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
        />
      )

    case "boolean":
      return (
        <Checkbox
          label={field.name}
          required={field.required}
          error={error}
          checked={asBoolean(value)}
          onChange={(e) => {
            onChange(e.currentTarget.checked)
          }}
        />
      )

    case "select": {
      const options = (field.options?.values as string[] | undefined) ?? []
      return (
        <Select
          {...commonProps}
          data={options}
          value={asString(value) || null}
          onChange={(v) => {
            onChange(v)
          }}
          clearable={!field.required}
        />
      )
    }

    case "tags":
      return (
        <TagsInput
          {...commonProps}
          value={asStringArray(value)}
          onChange={(v) => {
            onChange(v)
          }}
        />
      )

    case "int":
    case "float":
      return (
        <NumberInput
          {...commonProps}
          value={asNumber(value)}
          onChange={(v) => {
            onChange(v)
          }}
          min={field.options?.min as number | undefined}
          max={field.options?.max as number | undefined}
          allowDecimal={field.type === "float"}
        />
      )

    case "datetime":
      return (
        <DateTimePicker
          {...commonProps}
          value={value ? new Date(asString(value)) : null}
          onChange={(date) => {
            onChange(date)
          }}
          clearable={!field.required}
        />
      )

    default:
      return (
        <TextInput
          {...commonProps}
          value={asString(value)}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
        />
      )
  }
}

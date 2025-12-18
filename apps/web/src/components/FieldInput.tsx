import { TextInput, Textarea, Checkbox, Select, NumberInput, TagsInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import type {
  AttachmentMeta,
  NumericFieldOptions,
  SelectFieldOptions,
  SpaceField,
  StringFieldOptions,
} from "@spacenote/common/types"
import { MarkdownEditor } from "./MarkdownEditor"
import { ImageFieldInput } from "./ImageFieldInput"

interface FieldInputProps {
  field: SpaceField
  value?: unknown
  onChange: (value: unknown) => void
  error?: string
  spaceMembers?: string[]
  /** Called with image metadata after upload (for EXIF extraction) */
  onImageMetadata?: (meta: AttachmentMeta | null) => void
}

/** Type-safe string coercion for form values */
function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/** Type-safe boolean coercion for form values */
function asBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false
}

/** Type-safe number coercion, returns empty string for non-numbers (Mantine NumberInput requirement) */
function asNumber(value: unknown): number | string {
  return typeof value === "number" ? value : ""
}

/** Type-safe string array coercion for tags field */
function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string")
  }
  return []
}

/** Renders appropriate input control based on field type */
export function FieldInput({ field, value, onChange, error, spaceMembers, onImageMetadata }: FieldInputProps) {
  const commonProps = {
    label: field.name,
    required: field.required,
    error,
  }

  switch (field.type) {
    case "string": {
      const opts = field.options as StringFieldOptions
      if (opts.kind === "markdown") {
        return (
          <MarkdownEditor
            {...commonProps}
            value={asString(value)}
            onChange={(v) => {
              onChange(v)
            }}
          />
        )
      }
      if (opts.kind === "multi_line") {
        return (
          <Textarea
            {...commonProps}
            value={asString(value)}
            onChange={(e) => {
              onChange(e.currentTarget.value)
            }}
            autosize
            minRows={3}
          />
        )
      }
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
      const opts = field.options as SelectFieldOptions
      return (
        <Select
          {...commonProps}
          data={opts.values}
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

    case "numeric": {
      const opts = field.options as NumericFieldOptions
      return (
        <NumberInput
          {...commonProps}
          value={asNumber(value)}
          onChange={(v) => {
            onChange(v)
          }}
          min={opts.min ?? undefined}
          max={opts.max ?? undefined}
          allowDecimal={opts.kind !== "int"}
        />
      )
    }

    case "datetime":
      return (
        <DateTimePicker
          {...commonProps}
          value={value instanceof Date ? value : value ? new Date(asString(value)) : null}
          onChange={(date) => {
            onChange(date)
          }}
          clearable={!field.required}
        />
      )

    case "user":
      return (
        <Select
          {...commonProps}
          data={spaceMembers ?? []}
          value={asString(value) || null}
          onChange={(v) => {
            onChange(v)
          }}
          clearable={!field.required}
          searchable
        />
      )

    case "image": {
      const pendingNumber = typeof value === "number" ? value : null
      return (
        <ImageFieldInput
          label={field.name}
          required={field.required}
          error={error}
          value={pendingNumber}
          onChange={onChange}
          onMetadata={onImageMetadata}
        />
      )
    }

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

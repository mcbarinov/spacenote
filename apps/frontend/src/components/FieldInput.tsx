import { TextInput, Textarea, Checkbox, Select, NumberInput, TagsInput } from "@mantine/core"
import { DatePicker, DateTimePicker } from "@mantine/dates"
import type {
  AttachmentMeta,
  DatetimeFieldOptions,
  NumericFieldOptions,
  RecurrenceValue,
  SelectFieldOptions,
  SpaceField,
  StringFieldOptions,
} from "@/types"
import { MarkdownEditor } from "./MarkdownEditor"
import { ImageFieldInput } from "./ImageFieldInput"
import { RecurrenceFieldInput } from "./RecurrenceFieldInput"

interface NoteContext {
  slug: string
  noteNumber: number
  noteFields: Record<string, unknown>
}

interface FieldInputProps {
  field: SpaceField
  value?: unknown
  onChange: (value: unknown) => void
  error?: string
  spaceMembers?: string[]
  /** Called with image metadata after upload (for EXIF extraction) */
  onImageMetadata?: (meta: AttachmentMeta | null) => void
  /** Note context for fields that need it (recurrence actions) */
  noteContext?: NoteContext
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
export function FieldInput({ field, value, onChange, error, spaceMembers, onImageMetadata, noteContext }: FieldInputProps) {
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
      if (opts.kind === "text") {
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

    case "datetime": {
      const opts = field.options as DatetimeFieldOptions
      // Value can be a Date (from form state) or string (from API) — coerce to Date for pickers
      const dateValue = value instanceof Date ? value : value ? new Date(asString(value)) : null

      if (opts.kind === "date") {
        return (
          <DatePicker
            {...commonProps}
            value={dateValue}
            onChange={(date) => {
              onChange(date)
            }}
            allowDeselect={!field.required}
          />
        )
      }

      return (
        <DateTimePicker
          {...commonProps}
          value={dateValue}
          onChange={(date) => {
            onChange(date)
          }}
          clearable={!field.required}
        />
      )
    }

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

    case "recurrence": {
      const recurrenceNoteContext = noteContext
        ? (() => {
            const cv = noteContext.noteFields[field.name]
            return cv != null && typeof cv === "object" && "interval" in cv
              ? {
                  slug: noteContext.slug,
                  noteNumber: noteContext.noteNumber,
                  fieldName: field.name,
                  currentValue: cv as RecurrenceValue,
                }
              : undefined
          })()
        : undefined
      return (
        <RecurrenceFieldInput
          label={field.name}
          required={field.required}
          error={error}
          value={asString(value)}
          onChange={(v) => {
            onChange(v)
          }}
          noteContext={recurrenceNoteContext}
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

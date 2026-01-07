import { useCallback, useMemo } from "react"
import { Button, Group, Paper, Stack } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { ErrorMessage } from "@spacenote/common/components"
import { api } from "@spacenote/common/api"
import {
  computeExifDatetime,
  formatDatetimeForApi,
  getCurrentDatetimeForKind,
  parseDatetimeFromApi,
  type DatetimeKind,
} from "@spacenote/common/utils"
import type { AttachmentMeta, DatetimeFieldOptions, Note, Space, SpaceField } from "@spacenote/common/types"
import { FieldInput } from "./FieldInput"

interface ExifBinding {
  datetimeField: string
  imageField: string
  fallback: string | null
  kind: DatetimeKind
}

const EXIF_DEFAULT_REGEX = /^\$exif\.created_at:(\w+)(?:\|(.+))?$/

/** Parses $exif.created_at:{field}|{fallback} default value */
function parseExifDefault(defaultValue: string): { imageField: string; fallback: string | null } | null {
  const match = EXIF_DEFAULT_REGEX.exec(defaultValue)
  if (!match) return null
  return { imageField: match[1], fallback: match[2] || null }
}

/** Finds all datetime→image EXIF bindings in space fields */
function getExifBindings(fields: SpaceField[]): ExifBinding[] {
  return fields
    .filter((f): f is SpaceField & { default: string } => f.type === "datetime" && typeof f.default === "string")
    .map((f) => {
      const parsed = parseExifDefault(f.default)
      if (!parsed) return null
      const opts = f.options as DatetimeFieldOptions
      return { datetimeField: f.name, kind: opts.kind, ...parsed }
    })
    .filter((b): b is ExifBinding => b !== null)
}

/** Resolves fallback value like $now to actual value based on kind */
function resolveExifFallback(fallback: string | null, kind: DatetimeKind): string | null {
  if (fallback === "$now") {
    return getCurrentDatetimeForKind(kind)
  }
  return fallback
}

/** Gets initial form value for field based on type and default */
function getDefaultValue(field: SpaceField, currentUser: string): unknown {
  const defaultValue = field.default
  if (defaultValue !== null) {
    // Resolve $me for user fields
    if (field.type === "user" && defaultValue === "$me") {
      return currentUser
    }
    // Resolve $now for datetime fields — return Date for DateTimePicker
    if (field.type === "datetime" && defaultValue === "$now") {
      return new Date()
    }
    // $exif.created_at defaults start empty, filled on image upload
    if (field.type === "datetime" && typeof defaultValue === "string" && defaultValue.startsWith("$exif.created_at:")) {
      return ""
    }
    return defaultValue
  }
  switch (field.type) {
    case "boolean":
      return false
    case "numeric":
      return ""
    case "tags":
      return []
    default:
      return ""
  }
}

/** Converts form value to raw_fields string format for API */
function valueToString(value: unknown, field: SpaceField): string | null {
  if (value === "" || value == null) {
    return null
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value)
  }
  if (typeof value === "string") {
    return value
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(",") : null
  }
  if (value instanceof Date) {
    // For datetime fields, format based on kind
    if (field.type === "datetime") {
      const opts = field.options as DatetimeFieldOptions
      return formatDatetimeForApi(value, opts.kind)
    }
    // Fallback for other Date values (shouldn't happen)
    return formatDatetimeForApi(value, "utc")
  }
  return null
}

/** Builds initial form values from space fields */
function buildInitialValues(
  fields: SpaceField[],
  currentUser: string,
  existingValues?: Record<string, unknown>
): Record<string, unknown> {
  const initialValues: Record<string, unknown> = {}
  for (const field of fields) {
    if (existingValues && field.name in existingValues) {
      const value = existingValues[field.name]
      // Convert datetime strings to Date for picker based on kind
      if (field.type === "datetime" && typeof value === "string" && value) {
        const opts = field.options as DatetimeFieldOptions
        initialValues[field.name] = parseDatetimeFromApi(value, opts.kind)
      } else {
        initialValues[field.name] = value
      }
    } else {
      initialValues[field.name] = getDefaultValue(field, currentUser)
    }
  }
  return initialValues
}

/** Converts form values to raw_fields format for API submission */
function formValuesToRawFields(values: Record<string, unknown>, fields: SpaceField[]): Record<string, string> {
  const fieldMap = new Map(fields.map((f) => [f.name, f]))
  const raw_fields: Record<string, string> = {}
  for (const [key, value] of Object.entries(values)) {
    const field = fieldMap.get(key)
    if (!field) continue
    const str = valueToString(value, field)
    if (str !== null) {
      raw_fields[key] = str
    }
  }
  return raw_fields
}

type NoteFormProps = { space: Space; mode: "create"; note?: never } | { space: Space; mode: "edit"; note: Note }

/** Form for creating and editing notes */
export function NoteForm({ space, mode, note }: NoteFormProps) {
  const navigate = useNavigate()
  const currentUser = api.cache.useCurrentUser()
  const slug = space.slug

  // Filter fields for create mode
  const visibleFields =
    mode === "create" ? space.fields.filter((f) => !space.hidden_fields_on_create.includes(f.name)) : space.fields

  const form = useForm({
    initialValues: buildInitialValues(space.fields, currentUser.username, note?.fields),
  })

  const createMutation = api.mutations.useCreateNote(slug)
  const updateMutation = api.mutations.useUpdateNote(slug, note?.number ?? 0)
  const mutation = mode === "create" ? createMutation : updateMutation

  // EXIF bindings: datetime fields that should auto-populate from image EXIF (create mode only)
  const exifBindings = useMemo(() => (mode === "create" ? getExifBindings(space.fields) : []), [mode, space.fields])

  /** Creates handler for image field that populates bound datetime fields from EXIF */
  const createImageMetadataHandler = useCallback(
    (imageFieldName: string) => (meta: AttachmentMeta | null) => {
      for (const binding of exifBindings.filter((b) => b.imageField === imageFieldName)) {
        if (meta === null) {
          // Image removed: clear datetime field
          form.setFieldValue(binding.datetimeField, "")
        } else {
          // Image uploaded: compute datetime from EXIF based on kind, or use fallback
          const exifValue = computeExifDatetime(
            meta.image?.exif_date_time_original,
            meta.image?.exif_offset_time_original,
            binding.kind
          )
          const datetimeValue = exifValue ?? resolveExifFallback(binding.fallback, binding.kind)
          const dateObj = datetimeValue ? parseDatetimeFromApi(datetimeValue, binding.kind) : null
          if (dateObj) form.setFieldValue(binding.datetimeField, dateObj)
        }
      }
    },
    [exifBindings, form]
  )

  const handleSubmit = form.onSubmit((values) => {
    // Create mode: filter out hidden fields - backend applies their defaults
    // Edit mode: only send fields that were actually changed
    const fieldsToSend =
      mode === "create"
        ? Object.fromEntries(Object.entries(values).filter(([key]) => !space.hidden_fields_on_create.includes(key)))
        : Object.fromEntries(Object.entries(values).filter(([key]) => form.isDirty(key)))
    const raw_fields = formValuesToRawFields(fieldsToSend, space.fields)
    mutation.mutate(
      { raw_fields },
      {
        onSuccess: () => {
          if (mode === "create") {
            notifications.show({ message: "Note created", color: "green" })
            void navigate({ to: "/s/$slug", params: { slug } })
          } else {
            notifications.show({ message: "Note updated", color: "green" })
            void navigate({ to: "/s/$slug/$noteNumber", params: { slug, noteNumber: String(note.number) } })
          }
        },
      }
    )
  })

  return (
    <Paper withBorder p="xl">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {visibleFields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              spaceMembers={space.members}
              {...form.getInputProps(field.name)}
              onImageMetadata={field.type === "image" ? createImageMetadataHandler(field.name) : undefined}
            />
          ))}
          {mutation.error && <ErrorMessage error={mutation.error} />}
          <Group justify="flex-end">
            <Button type="submit" loading={mutation.isPending} disabled={mode === "edit" && !form.isDirty()}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}

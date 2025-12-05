import { Button, Group, Paper, Stack } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { ErrorMessage } from "@spacenote/common/components"
import { api } from "@spacenote/common/api"
import type { Note, Space, SpaceField } from "@spacenote/common/types"
import { FieldInput } from "./FieldInput"

/** Gets initial form value for field based on type and default */
function getDefaultValue(field: SpaceField): unknown {
  if (field.default !== null) {
    return field.default
  }
  switch (field.type) {
    case "boolean":
      return false
    case "int":
    case "float":
      return ""
    case "tags":
      return []
    default:
      return ""
  }
}

/** Converts form value to raw_fields string format for API */
function valueToString(value: unknown): string | null {
  if (value === "" || value === null || value === undefined) {
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
    return value.toISOString()
  }
  return null
}

/** Builds initial form values from space fields */
function buildInitialValues(fields: SpaceField[], existingValues?: Record<string, unknown>): Record<string, unknown> {
  const initialValues: Record<string, unknown> = {}
  for (const field of fields) {
    if (existingValues && field.name in existingValues) {
      initialValues[field.name] = existingValues[field.name]
    } else {
      initialValues[field.name] = getDefaultValue(field)
    }
  }
  return initialValues
}

/** Converts form values to raw_fields format for API submission */
function formValuesToRawFields(values: Record<string, unknown>): Record<string, string> {
  const raw_fields: Record<string, string> = {}
  for (const [key, value] of Object.entries(values)) {
    const str = valueToString(value)
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
  const slug = space.slug

  // Filter fields for create mode
  const visibleFields =
    mode === "create" ? space.fields.filter((f) => !space.hidden_fields_on_create.includes(f.name)) : space.fields

  const form = useForm({
    initialValues: buildInitialValues(space.fields, note?.fields),
  })

  const createMutation = api.mutations.useCreateNote(slug)
  const updateMutation = api.mutations.useUpdateNote(slug, note?.number ?? 0)
  const mutation = mode === "create" ? createMutation : updateMutation

  const handleSubmit = form.onSubmit((values) => {
    const raw_fields = formValuesToRawFields(values)
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
            <FieldInput key={field.name} field={field} spaceMembers={space.members} {...form.getInputProps(field.name)} />
          ))}
          {mutation.error && <ErrorMessage error={mutation.error} />}
          <Group justify="flex-end">
            <Button type="submit" loading={mutation.isPending}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}

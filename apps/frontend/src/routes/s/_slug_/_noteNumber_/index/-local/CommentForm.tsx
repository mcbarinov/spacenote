import { useEffect, useMemo, useState } from "react"
import { Button, Collapse, Group, Stack, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import { dateToUTC, utcToLocalDate } from "@/utils/datetime"
import type { Note, Space, SpaceField } from "@/types"
import { FieldInput } from "@/components/FieldInput"

interface CommentFormProps {
  space: Space
  note: Note
}

/** Converts form value to raw_fields string format for API */
function valueToString(value: unknown): string | null {
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
    return dateToUTC(value)
  }
  return null
}

/** Builds initial form values from note fields for editable fields only */
function buildFieldValues(fields: SpaceField[], noteFields: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const field of fields) {
    const value = noteFields[field.name]
    if (field.type === "datetime" && typeof value === "string" && value) {
      values[field.name] = utcToLocalDate(value)
    } else if (field.type === "recurrence" && value != null && typeof value === "object" && "interval" in value) {
      values[field.name] = (value as { interval: string }).interval
    } else {
      values[field.name] = value ?? ""
    }
  }
  return values
}

/** Gets only the fields that have changed from original note */
function getChangedFields(
  formValues: Record<string, unknown>,
  noteFields: Record<string, unknown>,
  editableFields: SpaceField[]
): Record<string, string> {
  const changed: Record<string, string> = {}
  for (const field of editableFields) {
    const formValue = valueToString(formValues[field.name])
    const noteValue = valueToString(noteFields[field.name])
    if (formValue !== noteValue && formValue !== null) {
      changed[field.name] = formValue
    }
  }
  return changed
}

/** Form for creating a new comment with optional field editing */
export function CommentForm({ space, note }: CommentFormProps) {
  const [fieldsOpen, setFieldsOpen] = useState(false)

  const editableFields = useMemo(
    () => space.fields.filter((f) => space.editable_fields_on_comment.includes(f.name) && f.type !== "image"),
    [space.fields, space.editable_fields_on_comment]
  )

  const hasEditableFields = editableFields.length > 0

  const initialFieldValues = useMemo(() => buildFieldValues(editableFields, note.fields), [editableFields, note.fields])

  const form = useForm({
    initialValues: {
      content: "",
      ...initialFieldValues,
    },
  })

  const createCommentMutation = api.mutations.useCreateComment(space.slug, note.number)
  const updateNoteMutation = api.mutations.useUpdateNote(space.slug, note.number)

  // After comment/field mutations invalidate and refetch the note, sync form to reflect server state
  useEffect(() => {
    const newFieldValues = buildFieldValues(editableFields, note.fields)
    for (const [key, value] of Object.entries(newFieldValues)) {
      form.setFieldValue(key, value)
    }
    // eslint-disable-next-line react-x/exhaustive-deps, react-hooks/exhaustive-deps -- only re-sync when server data changes
  }, [note.fields])

  const hasComment = form.values.content.trim() !== ""
  const changedFields = hasEditableFields ? getChangedFields(form.values, note.fields, editableFields) : {}
  const fieldsChanged = Object.keys(changedFields).length > 0
  const canSubmit = hasComment || fieldsChanged
  const isPending = createCommentMutation.isPending || updateNoteMutation.isPending
  const error = createCommentMutation.error ?? updateNoteMutation.error

  /** Resets form after successful submission */
  const resetForm = () => {
    form.setFieldValue("content", "")
    setFieldsOpen(false)
  }

  /** Submits comment and/or field changes */
  const handleSubmit = form.onSubmit((values) => {
    const raw_fields = fieldsChanged ? changedFields : undefined

    if (hasComment) {
      createCommentMutation.mutate({ content: values.content, raw_fields }, { onSuccess: resetForm })
    } else if (fieldsChanged) {
      updateNoteMutation.mutate({ raw_fields: changedFields }, { onSuccess: resetForm })
    }
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        <Textarea placeholder="Write a comment..." minRows={2} {...form.getInputProps("content")} />

        {hasEditableFields && (
          <Collapse in={fieldsOpen}>
            <Stack gap="sm" mb="sm">
              {editableFields.map((field) => (
                <FieldInput
                  key={field.name}
                  field={field}
                  spaceMembers={space.members.map((m) => m.username)}
                  {...form.getInputProps(field.name)}
                  noteContext={{ slug: space.slug, noteNumber: note.number, noteFields: note.fields }}
                />
              ))}
            </Stack>
          </Collapse>
        )}

        {error && <ErrorMessage error={error} />}

        <Group justify="flex-end">
          {hasEditableFields && (
            <Button
              variant="subtle"
              onClick={() => {
                setFieldsOpen(!fieldsOpen)
              }}
            >
              {fieldsOpen ? "Hide fields" : "Edit fields"}
            </Button>
          )}
          <Button type="submit" loading={isPending} disabled={!canSubmit}>
            {!hasComment && fieldsChanged ? "Update Note" : "Add Comment"}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

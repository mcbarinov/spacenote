import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { Button, Paper, Title, Stack, Group } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, LinkButton } from "@spacenote/common/components"
import type { SpaceField } from "@spacenote/common/types"
import { FieldInput } from "@/components/FieldInput"

function getDefaultValue(field: SpaceField): unknown {
  if (field.default !== undefined && field.default !== null) {
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

export const Route = createFileRoute("/_auth/s/$slug/new")({
  component: NewNotePage,
})

function NewNotePage() {
  const navigate = useNavigate()
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const createNoteMutation = api.mutations.useCreateNote(slug)

  const initialValues: Record<string, unknown> = {}
  for (const field of space.fields) {
    initialValues[field.name] = getDefaultValue(field)
  }

  const form = useForm({
    initialValues,
  })

  const handleSubmit = form.onSubmit((values) => {
    const raw_fields: Record<string, string> = {}
    for (const [key, value] of Object.entries(values)) {
      const str = valueToString(value)
      if (str !== null) {
        raw_fields[key] = str
      }
    }

    createNoteMutation.mutate(
      { raw_fields },
      {
        onSuccess: () => {
          notifications.show({
            message: "Note created",
            color: "green",
          })
          void navigate({ to: "/s/$slug", params: { slug } })
        },
      }
    )
  })

  return (
    <>
      <Title order={1} mb="md">
        New Note
      </Title>
      <Paper withBorder p="xl">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {space.fields.map((field) => (
              <FieldInput key={field.name} field={field} spaceMembers={space.members} {...form.getInputProps(field.name)} />
            ))}
            {createNoteMutation.error && <ErrorMessage error={createNoteMutation.error} />}
            <Group>
              <Button type="submit" loading={createNoteMutation.isPending}>
                Create
              </Button>
              <LinkButton to="/s/$slug" params={{ slug }} variant="subtle">
                Cancel
              </LinkButton>
            </Group>
          </Stack>
        </form>
      </Paper>
    </>
  )
}

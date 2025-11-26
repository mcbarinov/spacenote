import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { TextInput, Button, Paper, Title, Stack, Group } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, LinkButton } from "@spacenote/common/components"

export const Route = createFileRoute("/_auth/s/$slug/new")({
  component: NewNotePage,
})

function NewNotePage() {
  const navigate = useNavigate()
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const createNoteMutation = api.mutations.useCreateNote(slug)

  const initialValues: Record<string, string> = {}
  for (const field of space.fields) {
    initialValues[field.name] = ""
  }

  const form = useForm({
    initialValues,
  })

  const handleSubmit = form.onSubmit((values) => {
    const raw_fields: Record<string, string> = {}
    for (const [key, value] of Object.entries(values)) {
      if (value !== "") {
        raw_fields[key] = value
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
              <TextInput
                key={field.name}
                label={field.name}
                placeholder={field.name}
                required={field.required}
                {...form.getInputProps(field.name)}
              />
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

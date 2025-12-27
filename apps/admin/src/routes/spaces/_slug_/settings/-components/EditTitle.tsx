import { Button, Group, Paper, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"

interface EditTitleProps {
  space: Space
}

const schema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(100, { message: "Title must be at most 100 characters" }),
})

/** Form to edit space title */
export function EditTitle({ space }: EditTitleProps) {
  const updateMutation = api.mutations.useUpdateSpaceTitle(space.slug)

  const form = useForm({
    initialValues: { title: space.title },
    validate: zod4Resolver(schema),
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "Title updated", color: "green" })
      },
    })
  })

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Title</Title>
          <TextInput {...form.getInputProps("title")} />
          {updateMutation.error && <ErrorMessage error={updateMutation.error} />}
          <Group justify="flex-end">
            <Button type="submit" loading={updateMutation.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}

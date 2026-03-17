import { Button, Group, Paper, Stack, Textarea, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import type { Space } from "@/types"

interface EditDescriptionProps {
  space: Space
}

const schema = z.object({
  description: z.string().max(1000, { message: "Description must be at most 1000 characters" }),
})

/** Form to edit space description */
export function EditDescription({ space }: EditDescriptionProps) {
  const updateMutation = api.mutations.useUpdateSpaceDescription(space.slug)

  const form = useForm({
    initialValues: { description: space.description },
    validate: zod4Resolver(schema),
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "Description updated", color: "green" })
      },
    })
  })

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Description</Title>
          <Textarea autosize minRows={3} maxRows={6} {...form.getInputProps("description")} />
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

import { Button, Group, Paper, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { Space } from "@spacenote/common/types"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"

interface EditTelegramProps {
  space: Space
}

const schema = z.object({
  activity_channel: z.string(),
  mirror_channel: z.string(),
})

/** Form to edit Telegram integration settings */
export function EditTelegram({ space }: EditTelegramProps) {
  const updateMutation = api.mutations.useUpdateSpaceTelegram(space.slug)

  const form = useForm({
    initialValues: {
      activity_channel: space.telegram?.activity_channel ?? "",
      mirror_channel: space.telegram?.mirror_channel ?? "",
    },
    validate: zod4Resolver(schema),
  })

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate(
      {
        telegram: {
          activity_channel: values.activity_channel || null,
          mirror_channel: values.mirror_channel || null,
        },
      },
      {
        onSuccess: () => {
          notifications.show({ message: "Telegram settings updated", color: "green" })
        },
      }
    )
  })

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Telegram Integration</Title>
          <TextInput
            label="Activity Channel"
            description="Channel for activity notifications (e.g. @mychannel or -1001234567890)"
            placeholder="@channel or chat ID"
            {...form.getInputProps("activity_channel")}
          />
          <TextInput
            label="Mirror Channel"
            description="Channel for note mirroring"
            placeholder="@channel or chat ID"
            {...form.getInputProps("mirror_channel")}
          />
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

import { useState } from "react"
import { ActionIcon, Button, Group, Modal, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconKey } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"

interface SetPasswordButtonProps {
  username: string
}

/** Action icon with modal to set user password */
export function SetPasswordButton({ username }: SetPasswordButtonProps) {
  const [opened, setOpened] = useState(false)
  const setPasswordMutation = api.mutations.useSetUserPassword()
  const form = useForm({ initialValues: { password: "" } })

  const handleSubmit = form.onSubmit((values) => {
    setPasswordMutation.mutate(
      { username, password: values.password },
      {
        onSuccess: () => {
          notifications.show({ message: "Password updated", color: "green" })
          setOpened(false)
          form.reset()
        },
      }
    )
  })

  return (
    <>
      <ActionIcon
        variant="subtle"
        onClick={() => {
          setOpened(true)
        }}
      >
        <IconKey size={18} />
      </ActionIcon>
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false)
        }}
        title={`Set password for "${username}"`}
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <TextInput label="New password" type="password" required {...form.getInputProps("password")} />
            {setPasswordMutation.error && <ErrorMessage error={setPasswordMutation.error} />}
            <Group justify="flex-end">
              <Button type="submit" loading={setPasswordMutation.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  )
}

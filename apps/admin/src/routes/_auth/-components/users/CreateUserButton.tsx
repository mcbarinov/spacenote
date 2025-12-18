import { useState } from "react"
import { Button, Group, Modal, PasswordInput, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { CreateUserRequest } from "@spacenote/common/types"

const createUserSchema = z.object({
  username: z.string().min(1, { message: "Username must be at least 1 character" }),
  password: z.string().min(1, { message: "Password must be at least 1 character" }),
})

/** Button with modal to create a new user */
export function CreateUserButton() {
  const [opened, setOpened] = useState(false)
  const createUserMutation = api.mutations.useCreateUser()
  const form = useForm({
    initialValues: { username: "", password: "" },
    validate: zod4Resolver(createUserSchema),
  })

  const handleSubmit = form.onSubmit((values: CreateUserRequest) => {
    createUserMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "User created", color: "green" })
        setOpened(false)
        form.reset()
      },
    })
  })

  return (
    <>
      <Button
        size="xs"
        onClick={() => {
          setOpened(true)
        }}
      >
        Create User
      </Button>
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false)
        }}
        title="Create User"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <TextInput label="Username" required autoFocus {...form.getInputProps("username")} />
            <PasswordInput label="Password" required {...form.getInputProps("password")} />
            {createUserMutation.error && <ErrorMessage error={createUserMutation.error} />}
            <Group justify="flex-end">
              <Button type="submit" loading={createUserMutation.isPending}>
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  )
}

import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { Button, Group, Modal, PasswordInput, Stack, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { CreateUserRequest } from "@spacenote/common/types"

const createUserSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters" }),
  password: z.string().min(2, { message: "Password must be at least 2 characters" }),
})

interface CreateUserModalProps {
  opened: boolean
  onClose: () => void
}

export function CreateUserModal({ opened, onClose }: CreateUserModalProps) {
  const createUserMutation = api.mutations.useCreateUser()

  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: zod4Resolver(createUserSchema),
  })

  const handleSubmit = form.onSubmit((values: CreateUserRequest) => {
    createUserMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({
          message: "User created successfully",
          color: "green",
        })
        form.reset()
        onClose()
      },
    })
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Create User">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput label="Username" placeholder="username" autoFocus {...form.getInputProps("username")} />
          <PasswordInput label="Password" placeholder="password" {...form.getInputProps("password")} />
          {createUserMutation.error && <ErrorMessage error={createUserMutation.error} />}
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createUserMutation.isPending}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

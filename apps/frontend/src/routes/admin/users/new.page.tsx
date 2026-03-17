import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { Button, Group, Paper, PasswordInput, Stack, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import { PageHeader } from "@/components/PageHeader"
import type { CreateUserRequest } from "@/types"

export const Route = createFileRoute("/_auth/_admin/admin/users/new")({
  component: CreateUserPage,
})

const createUserSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
})

/** Form to create a new user */
function CreateUserPage() {
  const navigate = useNavigate()
  const createUserMutation = api.mutations.useCreateUser()

  const form = useForm({
    initialValues: { username: "", password: "" },
    validate: zod4Resolver(createUserSchema),
  })

  const handleSubmit = form.onSubmit((values: CreateUserRequest) => {
    createUserMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: "User created", color: "green" })
        void navigate({ to: "/admin/users" })
      },
    })
  })

  return (
    <Stack gap="md">
      <PageHeader breadcrumbs={[{ label: "Users", to: "/admin/users" }, { label: "Create User" }]} />

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Username" autoFocus {...form.getInputProps("username")} />
            <PasswordInput label="Password" {...form.getInputProps("password")} />
            {createUserMutation.error && <ErrorMessage error={createUserMutation.error} />}
            <Group justify="flex-end">
              <Button type="submit" loading={createUserMutation.isPending}>
                Create User
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}

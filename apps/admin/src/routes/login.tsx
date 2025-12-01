import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { TextInput, Button, Paper, Title, Stack, Center, PasswordInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: LoginPage,
})

const loginSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters" }),
  password: z.string().min(2, { message: "Password must be at least 2 characters" }),
})

/** Admin login form */
function LoginPage() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const loginMutation = api.mutations.useLogin()

  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: zod4Resolver(loginSchema),
  })

  const handleSubmit = form.onSubmit((values) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({
          message: "Logged in successfully",
          color: "green",
        })
        void navigate({ to: redirect ?? "/" })
      },
    })
  })

  return (
    <Center mih="100vh">
      <Paper withBorder p="xl" w={320}>
        <Title order={1} size="h2" mb="md">
          SpaceNote / Admin
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Username" placeholder="username" autoFocus {...form.getInputProps("username")} />
            <PasswordInput label="Password" placeholder="password" {...form.getInputProps("password")} />
            {loginMutation.error && <ErrorMessage error={loginMutation.error} />}
            <Button type="submit" loading={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  )
}

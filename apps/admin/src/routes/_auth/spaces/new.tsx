import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { Button, Group, MultiSelect, Paper, Stack, TextInput, Textarea } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@spacenote/common/api"
import { ErrorMessage, NewPageHeader } from "@spacenote/common/components"
import type { CreateSpaceRequest } from "@spacenote/common/types"

export const Route = createFileRoute("/_auth/spaces/new")({
  component: CreateSpacePage,
})

const createSpaceSchema = z.object({
  slug: z
    .string()
    .min(1, { message: "Slug is required" })
    .regex(/^[a-z0-9-]+$/, { message: "Slug must contain only lowercase letters, numbers, and hyphens" }),
  title: z.string().min(1, { message: "Title is required" }).max(100, { message: "Title must be at most 100 characters" }),
  description: z.string().max(1000, { message: "Description must be at most 1000 characters" }).optional(),
  members: z.array(z.string()),
})

/** Form to create a new space */
function CreateSpacePage() {
  const navigate = useNavigate()
  const users = api.cache.useUsers()
  const createSpaceMutation = api.mutations.useCreateSpace()

  const form = useForm({
    initialValues: {
      slug: "",
      title: "",
      description: "",
      members: [],
    },
    validate: zod4Resolver(createSpaceSchema),
  })

  const handleSubmit = form.onSubmit((values: CreateSpaceRequest) => {
    createSpaceMutation.mutate(values, {
      onSuccess: () => {
        notifications.show({
          message: "Space created successfully",
          color: "green",
        })
        void navigate({ to: "/spaces" })
      },
    })
  })

  // Admins manage system, not content - they cannot be space members
  const userOptions = users.filter((user) => user.username !== "admin").map((user) => user.username)

  return (
    <Stack gap="md">
      <NewPageHeader
        title="Create Space"
        breadcrumbs={[{ label: "Spaces", to: "/spaces" }]}
        bottomActions={
          <Button component={Link} to="/spaces/import" variant="light">
            Import
          </Button>
        }
      />

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Slug" placeholder="my-project" autoFocus {...form.getInputProps("slug")} />
            <TextInput label="Title" placeholder="My Project" {...form.getInputProps("title")} />
            <Textarea
              label="Description"
              placeholder="Project description"
              autosize
              minRows={3}
              maxRows={6}
              {...form.getInputProps("description")}
            />
            <MultiSelect
              label="Members"
              placeholder="Select members"
              data={userOptions}
              searchable
              {...form.getInputProps("members")}
            />
            {createSpaceMutation.error && <ErrorMessage error={createSpaceMutation.error} />}
            <Group justify="flex-end">
              <Button type="submit" loading={createSpaceMutation.isPending}>
                Create Space
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}

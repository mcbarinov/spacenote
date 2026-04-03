import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { Button, Group, MultiSelect, Paper, Select, Stack, TextInput, Textarea } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { api } from "@/api"
import { PageHeader } from "@/components/PageHeader"
import { ErrorMessage } from "@/components/ErrorMessage"
import type { CreateSpaceRequest } from "@/types"

export const Route = createFileRoute("/_auth/_spaces/spaces/new")({
  component: CreateSpacePage,
})

const createSpaceSchema = z.object({
  slug: z
    .string()
    .min(1, { message: "Slug is required" })
    .regex(/^[a-z0-9-]+$/, { message: "Slug must contain only lowercase letters, numbers, and hyphens" }),
  title: z.string().min(1, { message: "Title is required" }).max(100, { message: "Title must be at most 100 characters" }),
  description: z.string().max(1000, { message: "Description must be at most 1000 characters" }).optional(),
  source_space: z.string().optional(),
  parent: z.string().optional(),
  members: z.array(z.string()),
})

/** Form to create a new space */
function CreateSpacePage() {
  const navigate = useNavigate()
  const users = api.cache.useUsers()
  const spaces = api.cache.useSpaces()
  const createSpaceMutation = api.mutations.useCreateSpace()

  const form = useForm({
    initialValues: {
      slug: "",
      title: "",
      description: "",
      source_space: "",
      parent: "",
      members: [] as string[],
    },
    validate: zod4Resolver(createSpaceSchema),
  })

  const handleSubmit = form.onSubmit((values) => {
    const data: CreateSpaceRequest = {
      ...values,
      members: values.members.map((username) => ({ username, permissions: ["all"] })),
      source_space: values.source_space || null,
      parent: values.parent || null,
    }
    createSpaceMutation.mutate(data, {
      onSuccess: () => {
        notifications.show({
          message: "Space created successfully",
          color: "green",
        })
        void navigate({ to: "/" })
      },
    })
  })

  const userOptions = users.map((user) => user.username)
  const spaceOptions = spaces.map((space) => ({ value: space.slug, label: `${space.title} (${space.slug})` }))
  const parentOptions = spaces.filter((s) => !s.parent).map((s) => ({ value: s.slug, label: `${s.title} (${s.slug})` }))
  const hasParent = !!form.values.parent
  const hasSourceSpace = !!form.values.source_space

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces", to: "/" }, { label: "Create Space" }]}
        topActions={
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
            <Select
              label="Parent Space"
              description="Inherit fields, filters, and templates from a parent space"
              placeholder="None"
              data={parentOptions}
              clearable
              searchable
              disabled={hasSourceSpace}
              {...form.getInputProps("parent")}
            />
            <Select
              label="Source Space"
              description="Copy fields, filters, templates, and timezone from an existing space"
              placeholder="None"
              data={spaceOptions}
              clearable
              searchable
              disabled={hasParent}
              {...form.getInputProps("source_space")}
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

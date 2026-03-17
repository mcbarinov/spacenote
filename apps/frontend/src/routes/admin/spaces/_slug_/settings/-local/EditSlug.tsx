import { Button, Group, Paper, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import type { Space } from "@/types"

interface EditSlugProps {
  space: Space
}

const schema = z.object({
  new_slug: z
    .string()
    .min(1, { message: "Slug is required" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug must be lowercase alphanumeric with hyphens" }),
})

/** Form to rename space slug with confirmation */
export function EditSlug({ space }: EditSlugProps) {
  const navigate = useNavigate()
  const renameMutation = api.mutations.useRenameSpaceSlug(space.slug)

  const form = useForm({
    initialValues: { new_slug: space.slug },
    validate: zod4Resolver(schema),
  })

  const handleSubmit = form.onSubmit((values) => {
    if (values.new_slug === space.slug) return

    modals.openConfirmModal({
      title: "Rename Slug",
      children: `Are you sure you want to rename the slug from "${space.slug}" to "${values.new_slug}"? This will change all URLs and references.`,
      labels: { confirm: "Rename", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        renameMutation.mutate(values, {
          onSuccess: (data) => {
            notifications.show({ message: "Slug renamed", color: "green" })
            void navigate({ to: "/admin/spaces/$slug/settings", params: { slug: data.slug } })
          },
        })
      },
    })
  })

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Rename Slug</Title>
          <TextInput {...form.getInputProps("new_slug")} />
          {renameMutation.error && <ErrorMessage error={renameMutation.error} />}
          <Group justify="flex-end">
            <Button type="submit" color="red" loading={renameMutation.isPending}>
              Rename Slug
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}

import { createFileRoute, Link } from "@tanstack/react-router"
import { ActionIcon, Badge, Code, Group, Paper, Stack, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPencil } from "@tabler/icons-react"
import { api } from "@/api"
import { DeleteButton } from "@/components/DeleteButton"
import { LinkButton } from "@/components/LinkButton"
import { PageHeader } from "@/components/PageHeader"
import { SpaceTabs } from "@/routes/spaces/-shared/SpaceTabs"
import type { SpaceField } from "@/types"

export const Route = createFileRoute("/_auth/_spaces/spaces/$slug/fields/")({
  component: FieldsPage,
})

/** Table displaying space fields with delete action */
function FieldsTable({ spaceSlug, fields }: { spaceSlug: string; fields: SpaceField[] }) {
  const deleteFieldMutation = api.mutations.useDeleteField(spaceSlug)

  if (fields.length === 0) {
    return (
      <Paper withBorder p="md">
        <Text c="dimmed">No fields defined yet</Text>
      </Paper>
    )
  }

  return (
    <Paper withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Required</Table.Th>
            <Table.Th>Default</Table.Th>
            <Table.Th>Options</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fields.map((field) => (
            <Table.Tr key={field.name}>
              <Table.Td>{field.name}</Table.Td>
              <Table.Td>
                <Badge variant="light" size="sm">
                  {field.type}
                </Badge>
              </Table.Td>
              <Table.Td>{field.required ? "Yes" : "No"}</Table.Td>
              <Table.Td>
                <Code>{field.default !== null ? JSON.stringify(field.default) : "-"}</Code>
              </Table.Td>
              <Table.Td>
                <Code style={{ maxWidth: 400, wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
                  {Object.keys(field.options).length > 0 ? JSON.stringify(field.options) : "-"}
                </Code>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Link to="/spaces/$slug/fields/$fieldName/edit" params={{ slug: spaceSlug, fieldName: field.name }}>
                    <ActionIcon variant="subtle">
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Link>
                  <DeleteButton
                    title="Delete Field"
                    message={`Are you sure you want to delete field "${field.name}"?`}
                    onConfirm={() => {
                      deleteFieldMutation.mutate(field.name, {
                        onSuccess: () => {
                          notifications.show({
                            message: "Field deleted successfully",
                            color: "green",
                          })
                        },
                      })
                    }}
                  />
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

/** Space fields list with add field button */
function FieldsPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces", to: "/" }, { label: `◈ ${space.slug}` }, { label: "Fields" }]}
        topActions={
          <>
            <SpaceTabs space={space} />
            <LinkButton to="/spaces/$slug/fields/new" params={{ slug }}>
              Add Field
            </LinkButton>
          </>
        }
      />
      <FieldsTable spaceSlug={slug} fields={space.fields} />
    </Stack>
  )
}

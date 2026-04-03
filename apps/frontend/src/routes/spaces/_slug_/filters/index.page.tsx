import { createFileRoute, Link } from "@tanstack/react-router"
import { ActionIcon, Badge, Code, Group, Paper, Stack, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPencil } from "@tabler/icons-react"
import { api } from "@/api"
import { DeleteButton } from "@/components/DeleteButton"
import { LinkButton } from "@/components/LinkButton"
import { PageHeader } from "@/components/PageHeader"
import { SpaceTabs } from "@/routes/spaces/-shared/SpaceTabs"
import { getInheritedFilterNames, useParentSpace } from "@/routes/spaces/-shared/inheritance"
import type { Filter } from "@/types"

export const Route = createFileRoute("/_auth/_spaces/spaces/$slug/filters/")({
  component: FiltersPage,
})

/** Table displaying space filters with delete action */
function FiltersTable({
  spaceSlug,
  filters,
  inheritedNames,
}: {
  spaceSlug: string
  filters: Filter[]
  inheritedNames: Set<string>
}) {
  const deleteFilterMutation = api.mutations.useDeleteFilter(spaceSlug)

  if (filters.length === 0) {
    return (
      <Paper withBorder p="md">
        <Text c="dimmed">No filters defined yet</Text>
      </Paper>
    )
  }

  return (
    <Paper withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Default Columns</Table.Th>
            <Table.Th>Conditions</Table.Th>
            <Table.Th>Sort</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filters.map((filter) => {
            const inherited = inheritedNames.has(filter.name)
            return (
              <Table.Tr key={filter.name} style={inherited ? { opacity: 0.7 } : undefined}>
                <Table.Td>
                  <Group gap="xs">
                    {filter.name}
                    {inherited && (
                      <Badge size="xs" variant="light" color="gray">
                        inherited
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Code>{filter.default_columns.join(", ") || "-"}</Code>
                </Table.Td>
                <Table.Td>
                  {filter.conditions.map((c) => (
                    <div key={`${c.field}-${c.operator}-${JSON.stringify(c.value)}`}>
                      <Code>
                        {c.field} {c.operator} {JSON.stringify(c.value)}
                      </Code>
                    </div>
                  ))}
                </Table.Td>
                <Table.Td style={{ whiteSpace: "nowrap" }}>
                  <Code>{filter.sort.join(", ")}</Code>
                </Table.Td>
                <Table.Td>
                  {inherited ? (
                    <Text size="xs" c="dimmed">
                      from parent
                    </Text>
                  ) : (
                    <Group gap="xs" wrap="nowrap">
                      <Link to="/spaces/$slug/filters/$filterName/edit" params={{ slug: spaceSlug, filterName: filter.name }}>
                        <ActionIcon variant="subtle">
                          <IconPencil size={16} />
                        </ActionIcon>
                      </Link>
                      <DeleteButton
                        title="Delete Filter"
                        message={`Are you sure you want to delete filter "${filter.name}"?`}
                        onConfirm={() => {
                          deleteFilterMutation.mutate(filter.name, {
                            onSuccess: () => {
                              notifications.show({
                                message: "Filter deleted successfully",
                                color: "green",
                              })
                            },
                          })
                        }}
                      />
                    </Group>
                  )}
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

/** Space filters list with add filter button */
function FiltersPage() {
  const { slug } = Route.useParams()
  const space = api.cache.useSpace(slug)
  const parentSpace = useParentSpace(space)
  const inheritedNames = parentSpace ? getInheritedFilterNames(parentSpace, space) : new Set<string>()

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[{ label: "Spaces", to: "/" }, { label: `◈ ${space.slug}` }, { label: "Filters" }]}
        topActions={
          <>
            <SpaceTabs space={space} />
            <LinkButton to="/spaces/$slug/filters/new" params={{ slug }}>
              Add Filter
            </LinkButton>
          </>
        }
      />
      <FiltersTable spaceSlug={slug} filters={space.filters} inheritedNames={inheritedNames} />
    </Stack>
  )
}

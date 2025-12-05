import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { Button, Group, Paper, Stack, TagsInput, TextInput, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPlus } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { FilterOperator } from "@spacenote/common/types"
import { SpaceHeader } from "@/components/SpaceHeader"
import { ConditionRow } from "./-components/ConditionRow"
import { type FilterFormValues, filterSchema, generateConditionId, SYSTEM_FIELDS } from "./-components/filterFormUtils"

export const Route = createFileRoute("/_auth/spaces/$slug/filters/new")({
  component: AddFilterPage,
})

/** Form to add a new filter to a space */
function AddFilterPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const addFilterMutation = api.mutations.useAddFilter(slug)

  const allFields = [...space.fields.map((f) => ({ ...f, name: `note.fields.${f.name}` })), ...SYSTEM_FIELDS]

  const form = useForm<FilterFormValues>({
    initialValues: {
      name: "",
      notesListDefaultColumns: "",
      conditions: [],
      sort: [],
    },
    validate: zod4Resolver(filterSchema),
  })

  const addCondition = () => {
    form.insertListItem("conditions", {
      id: generateConditionId(),
      field: "",
      operator: "",
      value: "",
    })
  }

  const removeCondition = (index: number) => {
    form.removeListItem("conditions", index)
  }

  const handleSubmit = form.onSubmit((values) => {
    const notesListDefaultColumns = values.notesListDefaultColumns
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const conditions = values.conditions
      .filter((c) => c.field && c.operator)
      .map((c) => ({
        field: c.field,
        operator: c.operator as FilterOperator,
        value: c.value as string | number | boolean | string[] | null,
      }))

    addFilterMutation.mutate(
      {
        name: values.name,
        notes_list_default_columns: notesListDefaultColumns,
        conditions,
        sort: values.sort,
      },
      {
        onSuccess: () => {
          notifications.show({
            message: "Filter added successfully",
            color: "green",
          })
          void navigate({ to: "/spaces/$slug/filters", params: { slug } })
        },
      }
    )
  })

  return (
    <Stack gap="md">
      <SpaceHeader space={space} title="New Filter" />

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Name" placeholder="filter_name" autoFocus withAsterisk {...form.getInputProps("name")} />

            <TextInput
              label="Notes List Columns"
              placeholder="note.fields.title, note.fields.status, note.created_at"
              description="Comma-separated field names to show in list view"
              {...form.getInputProps("notesListDefaultColumns")}
            />

            <Stack gap="xs">
              <Title order={4}>
                Conditions <span style={{ color: "var(--mantine-color-red-6)" }}>*</span>
              </Title>
              {form.errors.conditions && typeof form.errors.conditions === "string" && (
                <span style={{ color: "var(--mantine-color-red-6)", fontSize: "var(--mantine-font-size-sm)" }}>
                  {form.errors.conditions}
                </span>
              )}
              {form.values.conditions.map((condition, index) => (
                <ConditionRow
                  key={condition.id}
                  condition={condition}
                  index={index}
                  allFields={allFields}
                  spaceFields={space.fields}
                  spaceMembers={space.members}
                  form={form}
                  onRemove={() => {
                    removeCondition(index)
                  }}
                />
              ))}
              <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addCondition}>
                Add Condition
              </Button>
            </Stack>

            <TagsInput
              label="Sort"
              placeholder="field1, -field2 (prefix with - for descending)"
              description="Field names for sorting, use - prefix for descending order"
              withAsterisk
              {...form.getInputProps("sort")}
            />

            {addFilterMutation.error && <ErrorMessage error={addFilterMutation.error} />}

            <Group justify="flex-end">
              <Button type="submit" loading={addFilterMutation.isPending}>
                Add Filter
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  )
}

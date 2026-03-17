import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { Button, Group, Stack, TagsInput, TextInput, Title } from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"
import type { FilterOperator, SpaceField } from "@/types"
import { ErrorMessage } from "@/components/ErrorMessage"
import { generateConditionId, systemFieldsAsSpaceFields } from "@/utils/filters"
import { ConditionRow } from "./ConditionRow"
import { type FilterFormValues, filterSchema, allFilterSchema } from "./filterFormUtils"

interface FilterFormProps {
  mode: "create" | "edit"
  spaceFields: SpaceField[]
  spaceMembers: string[]
  initialValues: FilterFormValues
  isAllFilter?: boolean
  onSubmit: (data: {
    name: string
    default_columns: string[]
    conditions: { field: string; operator: FilterOperator; value: string | number | boolean | string[] | null }[]
    sort: string[]
  }) => void
  error: Error | null
  isPending: boolean
}

/** Shared form for creating and editing filters */
export function FilterForm({
  mode,
  spaceFields,
  spaceMembers,
  initialValues,
  isAllFilter,
  onSubmit,
  error,
  isPending,
}: FilterFormProps) {
  const allFields = [...spaceFields.map((f) => ({ ...f, name: `note.fields.${f.name}` })), ...systemFieldsAsSpaceFields()]

  const form = useForm<FilterFormValues>({
    initialValues,
    validate: zod4Resolver(isAllFilter ? allFilterSchema : filterSchema),
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
    const defaultColumns = values.defaultColumns
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

    onSubmit({ name: values.name, default_columns: defaultColumns, conditions, sort: values.sort })
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="filter_name"
          autoFocus={mode === "create"}
          withAsterisk={!isAllFilter}
          disabled={isAllFilter}
          {...form.getInputProps("name")}
        />

        <TextInput
          label="Default Columns"
          placeholder="note.fields.title, note.fields.status, note.created_at"
          description="Fields to display as columns in default view mode"
          {...form.getInputProps("defaultColumns")}
        />

        {!isAllFilter && (
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
                spaceFields={spaceFields}
                spaceMembers={spaceMembers}
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
        )}

        <TagsInput
          label="Sort"
          placeholder="field1, -field2 (prefix with - for descending)"
          description="Field names for sorting, use - prefix for descending order"
          withAsterisk
          {...form.getInputProps("sort")}
        />

        {error && <ErrorMessage error={error} />}

        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            {mode === "create" ? "Add Filter" : "Save Changes"}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

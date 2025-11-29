import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { z } from "zod"
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  TagsInput,
  TextInput,
  Title,
} from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"
import type { FieldType, FilterOperator, SpaceField } from "@spacenote/common/types"

export const Route = createFileRoute("/_auth/spaces/$slug/filters/new")({
  component: AddFilterPage,
})

const SYSTEM_FIELDS: SpaceField[] = [
  { name: "note.number", type: "int", required: true, options: {}, default: null },
  { name: "note.created_at", type: "datetime", required: true, options: {}, default: null },
  { name: "note.author", type: "user", required: true, options: {}, default: null },
]

const OPERATORS_BY_TYPE: Record<FieldType, string[]> = {
  string: ["eq", "ne", "contains", "startswith", "endswith"],
  markdown: ["eq", "ne", "contains", "startswith", "endswith"],
  boolean: ["eq", "ne"],
  int: ["eq", "ne", "gt", "gte", "lt", "lte"],
  float: ["eq", "ne", "gt", "gte", "lt", "lte"],
  datetime: ["eq", "ne", "gt", "gte", "lt", "lte"],
  select: ["eq", "ne", "in", "nin"],
  tags: ["eq", "ne", "in", "nin", "all"],
  user: ["eq", "ne"],
  image: [],
}

const addFilterSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Name must contain only letters, numbers, hyphens and underscores" }),
  displayFields: z.string(),
  conditions: z
    .array(
      z.object({
        id: z.string(),
        field: z.string().min(1, { message: "Field is required" }),
        operator: z.string().min(1, { message: "Operator is required" }),
        value: z.unknown(),
      })
    )
    .min(1, { message: "At least one condition is required" }),
  sort: z.array(z.string()).min(1, { message: "At least one sort field is required" }),
})

type FormValues = z.infer<typeof addFilterSchema>

interface ConditionValue {
  id: string
  field: string
  operator: string
  value: unknown
}

function getFieldDefinition(fieldName: string, spaceFields: SpaceField[]): SpaceField | undefined {
  if (fieldName.startsWith("note.")) {
    return SYSTEM_FIELDS.find((f) => f.name === fieldName)
  }
  return spaceFields.find((f) => f.name === fieldName)
}

let conditionIdCounter = 0

function AddFilterPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const space = api.cache.useSpace(slug)
  const addFilterMutation = api.mutations.useAddFilter(slug)

  const allFields = [...space.fields, ...SYSTEM_FIELDS]

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      displayFields: "",
      conditions: [],
      sort: [],
    },
    validate: zod4Resolver(addFilterSchema),
  })

  const addCondition = () => {
    conditionIdCounter += 1
    form.insertListItem("conditions", {
      id: `condition-${String(conditionIdCounter)}`,
      field: "",
      operator: "",
      value: "",
    })
  }

  const removeCondition = (index: number) => {
    form.removeListItem("conditions", index)
  }

  const handleSubmit = form.onSubmit((values) => {
    const displayFields = values.displayFields
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
        display_fields: displayFields,
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
      <Title order={1}>Add Filter</Title>

      <Paper withBorder p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Name" placeholder="filter_name" autoFocus withAsterisk {...form.getInputProps("name")} />

            <TextInput
              label="Display Fields"
              placeholder="field1, field2, note.created_at"
              description="Comma-separated field names to show in list view"
              {...form.getInputProps("displayFields")}
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
              <Button
                variant="subtle"
                onClick={() => {
                  void navigate({ to: "/spaces/$slug/filters", params: { slug } })
                }}
              >
                Cancel
              </Button>
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

interface ConditionRowProps {
  condition: ConditionValue
  index: number
  allFields: SpaceField[]
  spaceMembers: string[]
  form: ReturnType<typeof useForm<FormValues>>
  onRemove: () => void
}

function ConditionRow({ condition, index, allFields, spaceMembers, form, onRemove }: ConditionRowProps) {
  const selectedField = getFieldDefinition(condition.field, allFields)
  const operators = selectedField ? OPERATORS_BY_TYPE[selectedField.type] : []
  const indexStr = String(index)

  const handleFieldChange = (value: string | null) => {
    form.setFieldValue(`conditions.${indexStr}.field`, value ?? "")
    form.setFieldValue(`conditions.${indexStr}.operator`, "")
    form.setFieldValue(`conditions.${indexStr}.value`, "")
  }

  const handleOperatorChange = (value: string | null) => {
    form.setFieldValue(`conditions.${indexStr}.operator`, value ?? "")
  }

  const handleValueChange = (v: unknown) => {
    form.setFieldValue(`conditions.${indexStr}.value`, v)
  }

  return (
    <Group gap="xs" align="flex-end">
      <Select
        label="Field"
        placeholder="Select field"
        data={allFields.map((f) => f.name)}
        value={condition.field || null}
        onChange={handleFieldChange}
        style={{ flex: 1 }}
      />
      <Select
        label="Operator"
        placeholder="Select operator"
        data={operators}
        value={condition.operator || null}
        onChange={handleOperatorChange}
        disabled={!selectedField}
        style={{ flex: 1 }}
      />
      <ValueInput
        field={selectedField}
        operator={condition.operator}
        value={condition.value}
        onChange={handleValueChange}
        spaceMembers={spaceMembers}
      />
      <ActionIcon variant="subtle" color="red" onClick={onRemove}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  )
}

interface ValueInputProps {
  field: SpaceField | undefined
  operator: string
  value: unknown
  onChange: (value: unknown) => void
  spaceMembers: string[]
}

function ValueInput({ field, operator, value, onChange, spaceMembers }: ValueInputProps) {
  if (!field || !operator) {
    return <TextInput label="Value" placeholder="Select field and operator first" disabled style={{ flex: 1 }} />
  }

  const isArrayOperator = ["in", "nin", "all"].includes(operator)

  switch (field.type) {
    case "string":
    case "markdown":
      return (
        <TextInput
          label="Value"
          placeholder="Enter value"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
          style={{ flex: 1 }}
        />
      )

    case "boolean":
      return (
        <Checkbox
          label="Value"
          checked={value === true}
          onChange={(e) => {
            onChange(e.currentTarget.checked)
          }}
          style={{ flex: 1 }}
        />
      )

    case "int":
    case "float":
      return (
        <NumberInput
          label="Value"
          placeholder="Enter number"
          value={typeof value === "number" ? value : ""}
          onChange={(v) => {
            onChange(v)
          }}
          allowDecimal={field.type === "float"}
          style={{ flex: 1 }}
        />
      )

    case "datetime": {
      const dateValue = value instanceof Date ? value : typeof value === "string" && value ? new Date(value) : null
      return (
        <DateTimePicker
          label="Value"
          placeholder="Select date and time"
          value={dateValue}
          onChange={(date) => {
            onChange(date)
          }}
          style={{ flex: 1 }}
        />
      )
    }

    case "select": {
      const options = (field.options.values as string[] | undefined) ?? []
      if (isArrayOperator) {
        return (
          <TagsInput
            label="Values"
            placeholder="Select values"
            data={options}
            value={Array.isArray(value) ? value : []}
            onChange={(v) => {
              onChange(v)
            }}
            style={{ flex: 1 }}
          />
        )
      }
      return (
        <Select
          label="Value"
          placeholder="Select value"
          data={options}
          value={typeof value === "string" ? value : null}
          onChange={(v) => {
            onChange(v)
          }}
          style={{ flex: 1 }}
        />
      )
    }

    case "tags":
      if (isArrayOperator) {
        return (
          <TagsInput
            label="Values"
            placeholder="Enter tags"
            value={Array.isArray(value) ? value : []}
            onChange={(v) => {
              onChange(v)
            }}
            style={{ flex: 1 }}
          />
        )
      }
      return (
        <TextInput
          label="Value"
          placeholder="Enter tag"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
          style={{ flex: 1 }}
        />
      )

    case "user":
      return (
        <Select
          label="Value"
          placeholder="Select user"
          data={spaceMembers}
          value={typeof value === "string" ? value : null}
          onChange={(v) => {
            onChange(v)
          }}
          searchable
          style={{ flex: 1 }}
        />
      )

    default:
      return (
        <TextInput
          label="Value"
          placeholder="Enter value"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
          style={{ flex: 1 }}
        />
      )
  }
}

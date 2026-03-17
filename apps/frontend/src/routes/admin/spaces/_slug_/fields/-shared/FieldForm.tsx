import { useForm } from "@mantine/form"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { Badge, Button, Checkbox, Group, Select, Stack, Text, TextInput } from "@mantine/core"
import type { FieldType, Space } from "@/types"
import { ErrorMessage } from "@/components/ErrorMessage"
import { StringFieldConfig } from "./StringFieldConfig"
import { BooleanFieldConfig } from "./BooleanFieldConfig"
import { SelectFieldConfig } from "./SelectFieldConfig"
import { TagsFieldConfig } from "./TagsFieldConfig"
import { UserFieldConfig } from "./UserFieldConfig"
import { DatetimeFieldConfig } from "./DatetimeFieldConfig"
import { NumericFieldConfig } from "./NumericFieldConfig"
import { ImageFieldConfig } from "./ImageFieldConfig"
import { fieldSchema, type FormValues } from "./fieldFormUtils"

const FIELD_TYPES: FieldType[] = ["string", "boolean", "select", "tags", "user", "datetime", "numeric", "image", "recurrence"]

interface FieldFormProps {
  mode: "create" | "edit"
  space: Space
  initialValues: FormValues
  /** The field type — for edit mode, fixed from existing field; for create, tracks form selection */
  fixedFieldType?: FieldType
  onSubmit: (values: FormValues) => void
  error: Error | null
  isPending: boolean
}

/** Shared form for creating and editing fields */
export function FieldForm({ mode, space, initialValues, fixedFieldType, onSubmit, error, isPending }: FieldFormProps) {
  const form = useForm<FormValues>({
    initialValues,
    validate: zod4Resolver(fieldSchema),
  })

  const fieldType = fixedFieldType ?? (form.values.type as FieldType)
  const handleSubmit = form.onSubmit(onSubmit)

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {mode === "create" ? (
          <>
            <TextInput label="Name" placeholder="field_name" autoFocus {...form.getInputProps("name")} />
            <Select label="Type" data={FIELD_TYPES} {...form.getInputProps("type")} />
          </>
        ) : (
          <>
            <div>
              <Text size="sm" fw={500} mb={4}>
                Name
              </Text>
              <Text>{form.values.name}</Text>
            </div>
            <div>
              <Text size="sm" fw={500} mb={4}>
                Type
              </Text>
              <Badge variant="light" size="sm">
                {form.values.type}
              </Badge>
            </div>
          </>
        )}

        <Checkbox label="Required" {...form.getInputProps("required", { type: "checkbox" })} />

        {fieldType === "string" && <StringFieldConfig form={form} />}
        {fieldType === "boolean" && <BooleanFieldConfig form={form} />}
        {fieldType === "select" && <SelectFieldConfig form={form} />}
        {fieldType === "tags" && <TagsFieldConfig form={form} />}
        {fieldType === "user" && <UserFieldConfig form={form} space={space} />}
        {fieldType === "datetime" && <DatetimeFieldConfig form={form} />}
        {fieldType === "numeric" && <NumericFieldConfig form={form} />}
        {fieldType === "image" && <ImageFieldConfig form={form} />}

        {error && <ErrorMessage error={error} />}
        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            {mode === "create" ? "Add Field" : "Save Changes"}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

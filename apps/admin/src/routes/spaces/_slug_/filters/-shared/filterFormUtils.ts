import { z } from "zod"
import type { FieldType, SpaceField } from "@spacenote/common/types"

/** System fields available for filtering */
export const SYSTEM_FIELDS: SpaceField[] = [
  { name: "note.number", type: "numeric", required: true, options: { kind: "int", min: null, max: null }, default: null },
  { name: "note.created_at", type: "datetime", required: true, options: {}, default: null },
  { name: "note.author", type: "user", required: true, options: {}, default: null },
]

/** Available operators grouped by field type */
export const OPERATORS_BY_TYPE: Record<FieldType, string[]> = {
  string: ["eq", "ne", "contains", "startswith", "endswith"],
  boolean: ["eq", "ne"],
  numeric: ["eq", "ne", "gt", "gte", "lt", "lte"],
  datetime: ["eq", "ne", "gt", "gte", "lt", "lte"],
  select: ["eq", "ne", "in", "nin"],
  tags: ["eq", "ne", "in", "nin", "all"],
  user: ["eq", "ne"],
  image: [],
}

const conditionSchema = z.object({
  id: z.string(),
  field: z.string().min(1, { message: "Field is required" }),
  operator: z.string().min(1, { message: "Operator is required" }),
  value: z.unknown(),
})

/** Zod schema for filter form validation */
export const filterSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Name must contain only letters, numbers, hyphens and underscores" }),
  defaultColumns: z.string(),
  conditions: z.array(conditionSchema).min(1, { message: "At least one condition is required" }),
  sort: z.array(z.string()).min(1, { message: "At least one sort field is required" }),
})

/** Zod schema for "all" filter (no conditions required) */
export const allFilterSchema = z.object({
  name: z.string(),
  defaultColumns: z.string(),
  conditions: z.array(conditionSchema),
  sort: z.array(z.string()).min(1, { message: "At least one sort field is required" }),
})

export type FilterFormValues = z.infer<typeof filterSchema>

export interface ConditionValue {
  id: string
  field: string
  operator: string
  value: unknown
}

/** Resolves field definition from field name (handles both system and custom fields) */
export function getFieldDefinition(fieldName: string, spaceFields: SpaceField[]): SpaceField | undefined {
  if (fieldName.startsWith("note.fields.")) {
    const customFieldName = fieldName.slice("note.fields.".length)
    return spaceFields.find((f) => f.name === customFieldName)
  }
  if (fieldName.startsWith("note.")) {
    return SYSTEM_FIELDS.find((f) => f.name === fieldName)
  }
  return undefined
}

let conditionIdCounter = 0

/** Generates a unique ID for a new condition */
export function generateConditionId(): string {
  conditionIdCounter += 1
  return `condition-${conditionIdCounter}`
}

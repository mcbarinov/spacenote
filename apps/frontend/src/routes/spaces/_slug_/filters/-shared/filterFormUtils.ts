/** Admin-specific filter form schemas and types */

import { z } from "zod"

export { OPERATORS_BY_TYPE, getFieldDefinition, generateConditionId, systemFieldsAsSpaceFields } from "@/utils/filters"

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

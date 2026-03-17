/** Shared filter constants and utilities used by both admin filter CRUD and user adhoc filters */

import type { FieldType, SpaceField } from "@/types"

/** System field available for filtering */
export interface SystemField {
  name: string
  label: string
  type: FieldType
}

/** System fields available for filtering (must match backend's get_system_field_definitions) */
export const SYSTEM_FIELDS: SystemField[] = [
  { name: "note.number", label: "Number", type: "numeric" },
  { name: "note.author", label: "Author", type: "user" },
  { name: "note.created_at", label: "Created", type: "datetime" },
  { name: "note.edited_at", label: "Edited", type: "datetime" },
  { name: "note.activity_at", label: "Activity", type: "datetime" },
]

/** Converts system fields to SpaceField[] for use in admin filter forms */
export function systemFieldsAsSpaceFields(): SpaceField[] {
  return SYSTEM_FIELDS.map((f) => ({ name: f.name, type: f.type, required: true, options: {}, default: null }))
}

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
  recurrence: [],
}

/** Display labels for operators */
export const OPERATOR_LABELS: Record<string, string> = {
  eq: "equals",
  ne: "not equals",
  contains: "contains",
  startswith: "starts with",
  endswith: "ends with",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  in: "in",
  nin: "not in",
  all: "has all",
}

/** Resolves field definition from field name (handles both system and custom fields) */
export function getFieldDefinition(fieldName: string, spaceFields: SpaceField[]): SpaceField | undefined {
  if (fieldName.startsWith("note.fields.")) {
    const customFieldName = fieldName.slice("note.fields.".length)
    return spaceFields.find((f) => f.name === customFieldName)
  }
  if (fieldName.startsWith("note.")) {
    const systemField = SYSTEM_FIELDS.find((f) => f.name === fieldName)
    if (systemField) return { name: systemField.name, type: systemField.type, required: true, options: {}, default: null }
  }
  return undefined
}

/** Extracts display name from field path (note.fields.status -> status, note.author -> author) */
export function getFieldDisplayName(fieldPath: string): string {
  if (fieldPath.startsWith("note.fields.")) return fieldPath.slice("note.fields.".length)
  if (fieldPath.startsWith("note.")) return fieldPath.slice("note.".length)
  return fieldPath
}

/** Generates unique ID for filter conditions */
export function generateConditionId(): string {
  return crypto.randomUUID()
}

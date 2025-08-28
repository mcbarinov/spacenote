import type { FieldType } from "@/types"

export const FIELD_TYPES: FieldType[] = [
  "string",
  "markdown",
  "boolean",
  "string_choice",
  "tags",
  "user",
  "datetime",
  "int",
  "float",
]

export function parseCommaSeparatedValues(input: string): string[] {
  return input
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
}

export function formatFieldOptions(type: FieldType, values?: string, min?: number, max?: number) {
  const options: Record<string, string[] | number> = {}

  if ((type === "string_choice" || type === "tags") && values) {
    options.values = parseCommaSeparatedValues(values)
  }

  if ((type === "int" || type === "float") && min !== undefined) {
    options.min = min
  }

  if ((type === "int" || type === "float") && max !== undefined) {
    options.max = max
  }

  return Object.keys(options).length > 0 ? options : {}
}

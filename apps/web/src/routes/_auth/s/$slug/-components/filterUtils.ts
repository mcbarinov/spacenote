/** Shared utilities for adhoc filter parsing and building */

export interface Condition {
  id: string
  field: string
  operator: string
  value: string
}

/** Generates unique ID for condition */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

/** Parses a condition string like "note.fields.status:eq:active" */
export function parseCondition(condition: string): Condition {
  const parts = condition.split(":")
  const field = parts[0]
  const operator = parts[1] || "eq"
  const value = parts.slice(2).join(":")
  return { id: generateId(), field, operator, value }
}

/** Parses query string into conditions array */
export function parseQueryString(q: string | undefined): Condition[] {
  if (!q) return []
  return q.split(",").map(parseCondition)
}

/** Builds query string from conditions array */
export function buildQueryString(conditions: Condition[]): string | undefined {
  const validConditions = conditions.filter((c) => c.field && c.operator && c.value)
  if (validConditions.length === 0) return undefined
  return validConditions.map((c) => `${c.field}:${c.operator}:${c.value}`).join(",")
}

/** Extracts display name from field path (note.fields.status → status, note.author → author) */
export function getFieldDisplayName(fieldPath: string): string {
  if (fieldPath.startsWith("note.fields.")) return fieldPath.slice("note.fields.".length)
  if (fieldPath.startsWith("note.")) return fieldPath.slice("note.".length)
  return fieldPath
}

/** Formats operator for display */
export function formatOperator(operator: string): string {
  const operators: Record<string, string> = {
    eq: "=",
    ne: "≠",
    gt: ">",
    gte: "≥",
    lt: "<",
    lte: "≤",
    in: ":",
    nin: "∉",
    contains: "~",
    startswith: "^",
    endswith: "$",
    all: "∋",
  }
  return operators[operator] ?? operator
}

/** Utilities for adhoc filter query string parsing and building */

export { getFieldDisplayName, generateConditionId } from "@/utils/filters"

export interface Condition {
  id: string
  field: string
  operator: string
  value: string
}

/** Parses a condition string like "note.fields.status:eq:active" */
export function parseCondition(condition: string): Condition {
  const parts = condition.split(":")
  const field = parts[0]
  const operator = parts[1] || "eq"
  const value = parts.slice(2).join(":")
  return { id: crypto.randomUUID(), field, operator, value }
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

/** Formats operator for display as a symbol */
export function formatOperator(operator: string): string {
  const operators: Record<string, string> = {
    eq: "=",
    ne: "\u2260",
    gt: ">",
    gte: "\u2265",
    lt: "<",
    lte: "\u2264",
    in: ":",
    nin: "\u2209",
    contains: "~",
    startswith: "^",
    endswith: "$",
    all: "\u220B",
  }
  return operators[operator] ?? operator
}

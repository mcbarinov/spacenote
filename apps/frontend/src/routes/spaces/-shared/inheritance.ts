import { api } from "@/api"
import type { Space } from "@/types"

/** Get parent space for a child space, or null if no parent or parent not accessible. */
export function useParentSpace(space: Space): Space | null {
  const spaces = api.cache.useSpaces()
  if (!space.parent) return null
  return spaces.find((s) => s.slug === space.parent) ?? null
}

/** Get child spaces of a given space. */
export function useChildSpaces(space: Space): Space[] {
  const spaces = api.cache.useSpaces()
  return spaces.filter((s) => s.parent === space.slug)
}

/** Get names of fields inherited from parent. */
export function getInheritedFieldNames(parentSpace: Space): Set<string> {
  return new Set(parentSpace.fields.map((f) => f.name))
}

/** Get names of filters purely inherited from parent (not overridden by child). */
export function getInheritedFilterNames(parentSpace: Space, childSpace: Space): Set<string> {
  const parentByName = new Map(parentSpace.filters.map((f) => [f.name, JSON.stringify(f)]))
  const result = new Set<string>()
  for (const filter of childSpace.filters) {
    const parentJson = parentByName.get(filter.name)
    if (parentJson && parentJson === JSON.stringify(filter)) {
      result.add(filter.name)
    }
  }
  return result
}

/** Get template keys purely inherited from parent (not overridden by child). */
export function getInheritedTemplateKeys(parentSpace: Space, childSpace: Space): Set<string> {
  const result = new Set<string>()
  for (const [key, value] of Object.entries(parentSpace.templates)) {
    if (childSpace.templates[key] === value) {
      result.add(key)
    }
  }
  return result
}

/** Get hidden_fields_on_create inherited from parent. */
export function getInheritedHiddenFieldsOnCreate(parentSpace: Space): Set<string> {
  return new Set(parentSpace.hidden_fields_on_create)
}

/** Get editable_fields_on_comment inherited from parent. */
export function getInheritedEditableFieldsOnComment(parentSpace: Space): Set<string> {
  return new Set(parentSpace.editable_fields_on_comment)
}

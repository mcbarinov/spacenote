import { z } from "zod"
import type { FieldType, SpaceField } from "@spacenote/common/types"

export const addFieldSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Name must contain only letters, numbers, hyphens and underscores" }),
  type: z.string().min(1, { message: "Type is required" }),
  required: z.boolean(),
  // Select options
  selectValues: z.array(z.string()),
  valueMaps: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      values: z.record(z.string(), z.string()),
    })
  ),
  // Int/Float options
  minValue: z.number().nullable(),
  maxValue: z.number().nullable(),
  // Image options
  maxWidth: z.number().nullable(),
  // Default value fields (type-specific)
  defaultString: z.string(),
  defaultBoolean: z.boolean().nullable(),
  defaultSelect: z.string().nullable(),
  defaultTags: z.array(z.string()),
  defaultUser: z.string().nullable(),
  defaultDatetime: z.string().nullable(),
  defaultInt: z.number().nullable(),
  defaultFloat: z.number().nullable(),
})

export type FormValues = z.infer<typeof addFieldSchema>

/** Builds options object based on field type */
export function buildOptions(values: FormValues): SpaceField["options"] {
  const fieldType = values.type as FieldType

  if (fieldType === "select" && values.selectValues.length > 0) {
    const options: SpaceField["options"] = { values: values.selectValues }

    // Add value_maps if any maps are defined
    if (values.valueMaps.length > 0) {
      const valueMapsObj: Record<string, Record<string, string>> = {}
      for (const map of values.valueMaps) {
        if (map.name) {
          valueMapsObj[map.name] = map.values
        }
      }
      if (Object.keys(valueMapsObj).length > 0) {
        options.value_maps = valueMapsObj
      }
    }

    return options
  }

  if (fieldType === "int" || fieldType === "float") {
    const numOptions: Record<string, number> = {}
    if (values.minValue !== null) numOptions.min = values.minValue
    if (values.maxValue !== null) numOptions.max = values.maxValue
    if (Object.keys(numOptions).length > 0) return numOptions
  }

  if (fieldType === "image" && values.maxWidth !== null) {
    return { max_width: values.maxWidth }
  }

  return {}
}

/** Builds default value based on field type */
export function buildDefault(values: FormValues): SpaceField["default"] {
  const fieldType = values.type as FieldType

  switch (fieldType) {
    case "string":
    case "markdown":
      return values.defaultString || null
    case "boolean":
      return values.defaultBoolean
    case "select":
      return values.defaultSelect
    case "tags":
      return values.defaultTags.length > 0 ? values.defaultTags : null
    case "user":
      return values.defaultUser
    case "datetime":
      return values.defaultDatetime
    case "int":
      return values.defaultInt
    case "float":
      return values.defaultFloat
    default:
      return null
  }
}

/** Parses SpaceField to form values for editing */
export function parseFieldToFormValues(field: SpaceField): FormValues {
  const values: FormValues = {
    name: field.name,
    type: field.type,
    required: field.required,
    selectValues: [],
    valueMaps: [],
    minValue: null,
    maxValue: null,
    maxWidth: null,
    defaultString: "",
    defaultBoolean: null,
    defaultSelect: null,
    defaultTags: [],
    defaultUser: null,
    defaultDatetime: null,
    defaultInt: null,
    defaultFloat: null,
  }

  // Parse options based on field type
  if (field.type === "select" && "values" in field.options) {
    values.selectValues = field.options.values as string[]

    if ("value_maps" in field.options) {
      const maps = field.options.value_maps as Record<string, Record<string, string>>
      values.valueMaps = Object.entries(maps).map(([name, mapValues]) => ({
        id: crypto.randomUUID(),
        name,
        values: mapValues,
      }))
    }
  }

  if (field.type === "int" || field.type === "float") {
    if ("min" in field.options) values.minValue = field.options.min as number
    if ("max" in field.options) values.maxValue = field.options.max as number
  }

  if (field.type === "image" && "max_width" in field.options) {
    values.maxWidth = field.options.max_width as number
  }

  // Parse default value
  if (field.default !== null) {
    switch (field.type) {
      case "string":
      case "markdown":
        values.defaultString = field.default as string
        break
      case "boolean":
        values.defaultBoolean = field.default as boolean
        break
      case "select":
        values.defaultSelect = field.default as string
        break
      case "tags":
        values.defaultTags = field.default as string[]
        break
      case "user":
        values.defaultUser = field.default as string
        break
      case "datetime":
        values.defaultDatetime = field.default as string
        break
      case "int":
        values.defaultInt = field.default as number
        break
      case "float":
        values.defaultFloat = field.default as number
        break
    }
  }

  return values
}

import { z } from "zod"
import {
  DATETIME_KINDS,
  NUMERIC_KINDS,
  STRING_KINDS,
  type DatetimeFieldOptions,
  type FieldType,
  type ImageFieldOptions,
  type NumericFieldOptions,
  type SelectFieldOptions,
  type SpaceField,
  type StringFieldOptions,
} from "@spacenote/common/types"

export const addFieldSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Name must contain only letters, numbers, hyphens and underscores" }),
  type: z.string().min(1, { message: "Type is required" }),
  required: z.boolean(),
  // String options
  stringKind: z.enum(STRING_KINDS),
  minLength: z.number().nullable(),
  maxLength: z.number().nullable(),
  // Numeric options
  numericKind: z.enum(NUMERIC_KINDS),
  // Datetime options
  datetimeKind: z.enum(DATETIME_KINDS),
  // Select options
  selectValues: z.array(z.string()),
  valueMaps: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      values: z.record(z.string(), z.string()),
    })
  ),
  // Numeric min/max
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
  defaultNumeric: z.number().nullable(),
})

export type FormValues = z.infer<typeof addFieldSchema>

/** Builds options object based on field type */
export function buildOptions(values: FormValues): SpaceField["options"] {
  const fieldType = values.type as FieldType

  if (fieldType === "string") {
    const opts: StringFieldOptions = {
      kind: values.stringKind,
      min_length: values.minLength,
      max_length: values.maxLength,
    }
    return opts
  }

  if (fieldType === "numeric") {
    const opts: NumericFieldOptions = {
      kind: values.numericKind,
      min: values.minValue,
      max: values.maxValue,
    }
    return opts
  }

  if (fieldType === "select" && values.selectValues.length > 0) {
    let valueMaps: Record<string, Record<string, string>> | null = null

    if (values.valueMaps.length > 0) {
      const valueMapsObj: Record<string, Record<string, string>> = {}
      for (const map of values.valueMaps) {
        if (map.name) {
          valueMapsObj[map.name] = map.values
        }
      }
      if (Object.keys(valueMapsObj).length > 0) {
        valueMaps = valueMapsObj
      }
    }

    const opts: SelectFieldOptions = {
      values: values.selectValues,
      value_maps: valueMaps,
    }
    return opts
  }

  if (fieldType === "image" && values.maxWidth !== null) {
    return { max_width: values.maxWidth }
  }

  if (fieldType === "datetime") {
    const opts: DatetimeFieldOptions = {
      kind: values.datetimeKind,
    }
    return opts
  }

  return {}
}

/** Builds default value based on field type */
export function buildDefault(values: FormValues): SpaceField["default"] {
  const fieldType = values.type as FieldType

  switch (fieldType) {
    case "string":
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
    case "numeric":
      return values.defaultNumeric
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
    stringKind: "line",
    minLength: null,
    maxLength: null,
    numericKind: "int",
    datetimeKind: "utc",
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
    defaultNumeric: null,
  }

  // Parse options based on field type
  if (field.type === "string") {
    const opts = field.options as StringFieldOptions
    // Form only supports line, text, markdown - default others to line
    const supportedKinds = ["line", "text", "markdown"] as const
    values.stringKind = supportedKinds.includes(opts.kind as (typeof supportedKinds)[number])
      ? (opts.kind as (typeof supportedKinds)[number])
      : "line"
    values.minLength = opts.min_length
    values.maxLength = opts.max_length
  }

  if (field.type === "numeric") {
    const opts = field.options as NumericFieldOptions
    values.numericKind = opts.kind
    values.minValue = opts.min
    values.maxValue = opts.max
  }

  if (field.type === "select") {
    const opts = field.options as SelectFieldOptions
    values.selectValues = opts.values

    if (opts.value_maps) {
      values.valueMaps = Object.entries(opts.value_maps).map(([name, mapValues]) => ({
        id: crypto.randomUUID(),
        name,
        values: mapValues,
      }))
    }
  }

  if (field.type === "image") {
    const opts = field.options as ImageFieldOptions
    values.maxWidth = opts.max_width ?? null
  }

  if (field.type === "datetime") {
    const opts = field.options as DatetimeFieldOptions
    values.datetimeKind = opts.kind ?? "utc"
  }

  // Parse default value
  if (field.default !== null) {
    switch (field.type) {
      case "string":
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
      case "numeric":
        values.defaultNumeric = field.default as number
        break
    }
  }

  return values
}

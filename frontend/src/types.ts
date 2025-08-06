export interface User {
  id: string
  username: string
  role: "admin" | "user"
}

export interface Space {
  id: string
  name: string
  members: string[]
  fields: SpaceField[]
  list_fields: string[]
  hidden_create_fields: string[]
  created_at: string
  updated_at: string
}

export type FieldType = "string" | "markdown" | "boolean" | "choice" | "tags" | "user" | "datetime" | "int" | "float" | "image"

export type FieldValue = string | boolean | string[] | number | null

export type FieldOptionValue = string[] | number

export type FieldOption = "values" | "min" | "max"

export interface SpaceField {
  name: string
  type: FieldType
  required: boolean
  options: Partial<Record<FieldOption, FieldOptionValue>>
  default: FieldValue
}

export interface Note {
  id: string
  space_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

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
  created_at: string
  updated_at: string
}

export type FieldType = "string" | "markdown" | "boolean" | "choice" | "tags" | "user" | "datetime" | "int" | "float" | "image"

export type FieldValue = string | boolean | string[] | number | null

export interface SpaceField {
  name: string
  type: FieldType
  required: boolean
  options: Record<string, FieldValue | FieldValue[]>
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

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

export const FIELD_TYPES = [
  "string",
  "markdown",
  "boolean",
  "choice",
  "tags",
  "user",
  "datetime",
  "int",
  "float",
  "image",
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

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
  id: number
  author: string
  created_at: string
  edited_at: string | null
  fields: Record<string, FieldValue>
  comment_count: number
  last_comment_at: string | null
  attachment_counts: {
    total: number
    by_type: Record<string, number>
  }
}

export interface PaginationResult {
  notes: Note[]
  total_count: number
  current_page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

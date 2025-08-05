export interface User {
  id: string
  username: string
  role: "admin" | "user"
}

export interface Space {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  space_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

import type { components } from "./openapi.gen"

// Core models
export type User = components["schemas"]["UserView"]
export type Space = components["schemas"]["Space"]
export type SpaceField = components["schemas"]["SpaceField"]
export type FieldType = components["schemas"]["FieldType"]
export type Note = components["schemas"]["Note"]

// Pagination
export type NotesList = components["schemas"]["PaginationResult_Note_"]

// Request/Response types
export type LoginRequest = components["schemas"]["LoginRequest"]
export type LoginResponse = components["schemas"]["LoginResponse"]
export type CreateUserRequest = components["schemas"]["CreateUserRequest"]
export type CreateSpaceRequest = components["schemas"]["CreateSpaceRequest"]

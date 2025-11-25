import type { components } from "./openapi.gen"

// Core models
export type User = components["schemas"]["UserView"]
export type Space = components["schemas"]["Space"]
export type SpaceField = components["schemas"]["SpaceField"]
export type FieldType = components["schemas"]["FieldType"]

// Request/Response types
export type LoginRequest = components["schemas"]["LoginRequest"]
export type LoginResponse = components["schemas"]["LoginResponse"]
export type CreateUserRequest = components["schemas"]["CreateUserRequest"]
export type CreateSpaceRequest = components["schemas"]["CreateSpaceRequest"]

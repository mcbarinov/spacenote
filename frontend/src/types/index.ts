import type { paths, components, operations } from "./generated"

export type { paths, components, operations }

export type LoginRequest = components["schemas"]["LoginRequest"]
export type LoginResponse = components["schemas"]["LoginResponse"]
export type Space = components["schemas"]["Space"]
export type Note = components["schemas"]["Note"]
export type SpaceField = components["schemas"]["SpaceField"]
export type Filter = components["schemas"]["Filter"]
export type FilterCondition = components["schemas"]["FilterCondition"]
export type FilterOperator = components["schemas"]["FilterOperator"]
export type FieldType = components["schemas"]["FieldType"]
export type FieldOption = components["schemas"]["FieldOption"]
export type CreateSpaceRequest = components["schemas"]["CreateSpaceRequest"]
export type AddFieldRequest = components["schemas"]["AddFieldRequest"]
export type CreateNoteRequest = components["schemas"]["CreateNoteRequest"]
export type HTTPValidationError = components["schemas"]["HTTPValidationError"]
export type ValidationError = components["schemas"]["ValidationError"]

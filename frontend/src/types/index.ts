import type { paths, components, operations } from "./generated"

export type { paths, components, operations }

export type LoginRequest = components["schemas"]["LoginRequest"]
export type LoginResponse = components["schemas"]["LoginResponse"]
export type User = components["schemas"]["UserView"]
export type Space = components["schemas"]["SpaceView"]
export type Note = components["schemas"]["NoteView"]
export type SpaceField = components["schemas"]["SpaceField"]
export type Filter = components["schemas"]["Filter"]
export type FilterCondition = components["schemas"]["FilterCondition"]
export type FilterOperator = components["schemas"]["FilterOperator"]
export type FieldType = components["schemas"]["FieldType"]
export type FieldOption = components["schemas"]["FieldOption"]
export type CreateSpaceRequest = components["schemas"]["CreateSpaceRequest"]
export type CreateNoteRequest = components["schemas"]["CreateNoteRequest"]
export type Comment = components["schemas"]["CommentView"]
export type CreateCommentRequest = components["schemas"]["CreateCommentRequest"]
export type HTTPValidationError = components["schemas"]["HTTPValidationError"]
export type ValidationError = components["schemas"]["ValidationError"]
export type CreateUserRequest = components["schemas"]["CreateUserRequest"]

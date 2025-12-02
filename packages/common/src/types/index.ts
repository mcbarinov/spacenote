import type { components } from "./openapi.gen"

// Core models
export type User = components["schemas"]["UserView"]
export type Space = components["schemas"]["Space"]
export type SpaceField = components["schemas"]["SpaceField"]
export type FieldType = components["schemas"]["FieldType"]
export type Note = components["schemas"]["Note"]

// Pagination
export type NotesList = components["schemas"]["PaginationResult_Note_"]

// Comments
export type Comment = components["schemas"]["Comment"]
export type CommentsList = components["schemas"]["PaginationResult_Comment_"]
export type CreateCommentRequest = components["schemas"]["CreateCommentRequest"]

// Attachments
export type Attachment = components["schemas"]["Attachment"]
export type PendingAttachment = components["schemas"]["PendingAttachment"]

// Request/Response types
export type LoginRequest = components["schemas"]["LoginRequest"]
export type LoginResponse = components["schemas"]["LoginResponse"]
export type CreateUserRequest = components["schemas"]["CreateUserRequest"]
export type CreateSpaceRequest = components["schemas"]["CreateSpaceRequest"]
export type CreateNoteRequest = components["schemas"]["CreateNoteRequest"]

// Filters
export type Filter = components["schemas"]["Filter"]
export type FilterCondition = components["schemas"]["FilterCondition"]
export type FilterOperator = components["schemas"]["FilterOperator"]

// Space update requests
export type UpdateTitleRequest = components["schemas"]["UpdateTitleRequest"]
export type UpdateDescriptionRequest = components["schemas"]["UpdateDescriptionRequest"]
export type UpdateHiddenFieldsOnCreateRequest = components["schemas"]["UpdateHiddenFieldsOnCreateRequest"]
export type UpdateNotesListDefaultColumnsRequest = components["schemas"]["UpdateNotesListDefaultColumnsRequest"]
export type UpdateMembersRequest = components["schemas"]["UpdateMembersRequest"]

// Export
export type ExportData = components["schemas"]["ExportData"]

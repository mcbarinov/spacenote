import type { components } from "./openapi.gen"

// Core models
export type User = components["schemas"]["UserView"]
export type Space = components["schemas"]["Space"]
export type SpaceField = components["schemas"]["SpaceField"]
export type FieldType = components["schemas"]["FieldType"]
export type Note = components["schemas"]["Note"]

// Field options
export type StringFieldOptions = components["schemas"]["StringFieldOptions"]
export type NumericFieldOptions = components["schemas"]["NumericFieldOptions"]
export type SelectFieldOptions = components["schemas"]["SelectFieldOptions"]

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
export type UpdateMembersRequest = components["schemas"]["UpdateMembersRequest"]
export type UpdateFieldRequest = components["schemas"]["UpdateFieldRequest"]

// Note update requests
export type UpdateNoteRequest = components["schemas"]["UpdateNoteRequest"]

// Export
export type ExportData = components["schemas"]["ExportData"]

// Templates
export type SetTemplateRequest = components["schemas"]["SetTemplateRequest"]

// Telegram
export type TelegramSettings = components["schemas"]["TelegramSettings"]
export type UpdateTelegramRequest = components["schemas"]["UpdateTelegramRequest"]
export type TelegramTask = components["schemas"]["TelegramTask"]
export type TelegramTaskStatus = components["schemas"]["TelegramTaskStatus"]
export type TelegramTaskType = components["schemas"]["TelegramTaskType"]
export type TelegramTasksList = components["schemas"]["PaginationResult_TelegramTask_"]
export type TelegramMirror = components["schemas"]["TelegramMirror"]
export type TelegramMirrorsList = components["schemas"]["PaginationResult_TelegramMirror_"]

export const TELEGRAM_TASK_STATUSES: TelegramTaskStatus[] = ["pending", "completed", "failed"]
export const TELEGRAM_TASK_TYPES: TelegramTaskType[] = [
  "activity_note_created",
  "activity_note_updated",
  "activity_comment_created",
  "mirror_create",
  "mirror_update",
]

import type { components } from "./openapi.gen"

export type User = components["schemas"]["UserView"]
export type BackupInfo = components["schemas"]["BackupInfo"]
export type ErrorLog = components["schemas"]["ErrorLog"]
export type Space = components["schemas"]["Space"]
export type LoginRequest = components["schemas"]["LoginRequest"]
export type LoginResponse = components["schemas"]["LoginResponse"]
export type CreateUserRequest = components["schemas"]["CreateUserRequest"]
export type TelegramTask = components["schemas"]["TelegramTask"]
export type TelegramTaskStatus = components["schemas"]["TelegramTaskStatus"]
export type TelegramTaskType = components["schemas"]["TelegramTaskType"]
export type TelegramTasksList = components["schemas"]["PaginationResult_TelegramTask_"]

export type TelegramMirror = components["schemas"]["TelegramMirror"]
export type TelegramMirrorsList = components["schemas"]["PaginationResult_TelegramMirror_"]

export type PendingAttachment = components["schemas"]["PendingAttachment"]
export type PendingAttachmentsList = components["schemas"]["PaginationResult_PendingAttachment_"]

export type CreateSpaceRequest = components["schemas"]["CreateSpaceRequest"]
export type ExportData = components["schemas"]["ExportData"]
export type UpdateMembersRequest = components["schemas"]["UpdateMembersRequest"]
export type UpdateTitleRequest = components["schemas"]["UpdateTitleRequest"]
export type UpdateDescriptionRequest = components["schemas"]["UpdateDescriptionRequest"]
export type RenameSlugRequest = components["schemas"]["RenameSlugRequest"]
export type UpdateDefaultFilterRequest = components["schemas"]["UpdateDefaultFilterRequest"]
export type UpdateHiddenFieldsOnCreateRequest = components["schemas"]["UpdateHiddenFieldsOnCreateRequest"]
export type UpdateEditableFieldsOnCommentRequest = components["schemas"]["UpdateEditableFieldsOnCommentRequest"]
export type UpdateCanTransferToRequest = components["schemas"]["UpdateCanTransferToRequest"]
export type SetActivityChannelRequest = components["schemas"]["SetActivityChannelRequest"]
export type EnableMirrorRequest = components["schemas"]["EnableMirrorRequest"]
export type SetTemplateRequest = components["schemas"]["SetTemplateRequest"]

export type Note = components["schemas"]["Note"]
export type NotesList = components["schemas"]["PaginationResult_Note_"]
export type CreateNoteRequest = components["schemas"]["CreateNoteRequest"]
export type UpdateNoteRequest = components["schemas"]["UpdateNoteRequest"]
export type SpaceField = components["schemas"]["SpaceField"]
export type SelectFieldOptions = components["schemas"]["SelectFieldOptions"]
export type NumericFieldOptions = components["schemas"]["NumericFieldOptions"]
export type FieldType = components["schemas"]["FieldType"]

export type StringFieldOptions = components["schemas"]["StringFieldOptions"]
export type DatetimeFieldOptions = components["schemas"]["DatetimeFieldOptions"]
export type ImageFieldOptions = components["schemas"]["ImageFieldOptions"]
export type UpdateFieldRequest = components["schemas"]["UpdateFieldRequest"]

export type StringKind = StringFieldOptions["kind"]
export type NumericKind = NumericFieldOptions["kind"]
export type DatetimeKind = NonNullable<DatetimeFieldOptions["kind"]>

export const STRING_KINDS = ["line", "text", "markdown"] as const satisfies readonly StringKind[]
export const NUMERIC_KINDS = ["int", "float", "decimal"] as const satisfies readonly NumericKind[]
export const DATETIME_KINDS = ["utc", "local", "date"] as const satisfies readonly DatetimeKind[]

export type Attachment = components["schemas"]["Attachment"]
export type AttachmentMeta = components["schemas"]["AttachmentMeta"]
export type RecurrenceValue = components["schemas"]["RecurrenceValue"]

export type Comment = components["schemas"]["Comment"]
export type CommentsList = components["schemas"]["PaginationResult_Comment_"]
export type CreateCommentRequest = components["schemas"]["CreateCommentRequest"]
export type TransferNoteRequest = components["schemas"]["TransferNoteRequest"]
export type TransferNoteResponse = components["schemas"]["TransferNoteResponse"]

export type Filter = components["schemas"]["Filter"]
export type FilterCondition = components["schemas"]["FilterCondition"]
export type FilterOperator = components["schemas"]["FilterOperator"]

export const TELEGRAM_TASK_STATUSES: TelegramTaskStatus[] = ["pending", "completed", "failed"]
export const TELEGRAM_TASK_TYPES: TelegramTaskType[] = [
  "activity_note_created",
  "activity_note_updated",
  "activity_comment_created",
  "mirror_create",
  "mirror_update",
]

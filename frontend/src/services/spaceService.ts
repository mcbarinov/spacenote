import { spacesApi, type Space, type CreateSpaceRequest, type ImportResult } from "@/lib/api/spaces"
import { useSpacesStore } from "@/stores/spacesStore"
import { toast } from "sonner"
import type { Filter } from "@/lib/api/notes"
import { handleUnauthorized } from "./authService"

// Type guard for HTTP errors with response
function isHttpError(error: unknown): error is { response: { status: number } } {
  return (
    error !== null &&
    typeof error === "object" &&
    "response" in error &&
    error.response !== null &&
    typeof error.response === "object" &&
    "status" in error.response
  )
}

// Helper function to reduce repetitive try-catch-toast pattern
async function executeWithToast<T>(operation: () => Promise<T>, successMessage: string, errorMessage: string): Promise<T> {
  try {
    const result = await operation()
    toast.success(successMessage)
    return result
  } catch (error) {
    // Check for 401 Unauthorized
    if (isHttpError(error) && error.response.status === 401) {
      handleUnauthorized()
      throw error
    }

    const message = error instanceof Error ? error.message : errorMessage
    toast.error(message)
    throw error
  }
}

export async function createSpace(data: CreateSpaceRequest): Promise<Space> {
  return executeWithToast(
    async () => {
      const space = await spacesApi.createSpace(data)
      useSpacesStore.getState().spaces.push(space)
      return space
    },
    "Space created successfully",
    "Failed to create space"
  )
}

export async function deleteSpace(spaceId: string): Promise<void> {
  return executeWithToast(
    async () => {
      await spacesApi.deleteSpace(spaceId)
      const store = useSpacesStore.getState()
      const index = store.spaces.findIndex(s => s.id === spaceId)
      if (index !== -1) {
        store.spaces.splice(index, 1)
      }
    },
    "Space deleted successfully",
    "Failed to delete space"
  )
}

export async function loadSpaces(force = false): Promise<void> {
  const store = useSpacesStore.getState()

  if (!force && (store.isLoading || store.spaces.length > 0)) {
    return
  }

  store.isLoading = true
  try {
    const spaces = await spacesApi.listSpaces()
    store.spaces.length = 0
    store.spaces.push(...spaces)
    store.error = null
  } catch (error) {
    // Check for 401 Unauthorized
    if (isHttpError(error) && error.response.status === 401) {
      handleUnauthorized()
      throw error
    }

    const message = error instanceof Error ? error.message : "Failed to load spaces"
    store.error = message
    throw error
  } finally {
    store.isLoading = false
  }
}

// Refresh single space data helper
async function refreshSpaceData(spaceId: string): Promise<void> {
  try {
    const space = await spacesApi.getSpace(spaceId)
    const store = useSpacesStore.getState()
    const index = store.spaces.findIndex(s => s.id === spaceId)
    if (index !== -1) {
      store.spaces[index] = space
    }
  } catch (error) {
    console.error("Failed to refresh space data:", error)
  }
}

export async function updateListFields(spaceId: string, fieldNames: string[]): Promise<void> {
  return executeWithToast(
    async () => {
      await spacesApi.updateListFields(spaceId, fieldNames)
      await refreshSpaceData(spaceId)
    },
    "List fields updated successfully",
    "Failed to update list fields"
  )
}

export async function updateHiddenCreateFields(spaceId: string, fieldNames: string[]): Promise<void> {
  return executeWithToast(
    async () => {
      await spacesApi.updateHiddenCreateFields(spaceId, fieldNames)
      await refreshSpaceData(spaceId)
    },
    "Hidden fields updated successfully",
    "Failed to update hidden fields"
  )
}

export async function updateNoteDetailTemplate(spaceId: string, template: string | null): Promise<void> {
  return executeWithToast(
    async () => {
      await spacesApi.updateNoteDetailTemplate(spaceId, template)
      await refreshSpaceData(spaceId)
    },
    "Note detail template updated successfully",
    "Failed to update note detail template"
  )
}

export async function updateNoteListTemplate(spaceId: string, template: string | null): Promise<void> {
  return executeWithToast(
    async () => {
      await spacesApi.updateNoteListTemplate(spaceId, template)
      await refreshSpaceData(spaceId)
    },
    "Note list template updated successfully",
    "Failed to update note list template"
  )
}

export async function createFilter(spaceId: string, filter: Filter): Promise<void> {
  return executeWithToast(
    async () => {
      await spacesApi.createFilter(spaceId, filter)
      await refreshSpaceData(spaceId)
    },
    "Filter created successfully",
    "Failed to create filter"
  )
}

export async function deleteFilter(spaceId: string, filterId: string): Promise<void> {
  return executeWithToast(
    async () => {
      await spacesApi.deleteFilter(spaceId, filterId)
      await refreshSpaceData(spaceId)
    },
    "Filter deleted successfully",
    "Failed to delete filter"
  )
}

export async function exportSpace(spaceId: string, includeContent = false): Promise<unknown> {
  return executeWithToast(
    async () => {
      return await spacesApi.exportSpace(spaceId, includeContent)
    },
    "Space exported successfully",
    "Failed to export space"
  )
}

export async function importSpace(data: unknown): Promise<ImportResult> {
  return executeWithToast(
    async () => {
      const result = await spacesApi.importSpace(data)
      await loadSpaces(true) // Refresh spaces list
      return result
    },
    "Space imported successfully",
    "Failed to import space"
  )
}

export function getSpace(spaceId: string): Space | undefined {
  return useSpacesStore.getState().spaces.find(space => space.id === spaceId)
}

import { spacesApi, type Space, type CreateSpaceRequest, type ImportResult, type SpaceField } from "@/lib/api/spaces"
import { useSpacesStore } from "@/stores/spacesStore"
import type { Filter } from "@/lib/api/notes"
import { executeWithToast, executeWithToastVoid, isHttpError } from "@/lib/serviceHelpers"
import { handleUnauthorized } from "./authService"

export async function createSpace(data: CreateSpaceRequest): Promise<Space | null> {
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
  return executeWithToastVoid(
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
  store.error = null

  try {
    const spaces = await spacesApi.listSpaces()
    store.spaces.length = 0
    store.spaces.push(...spaces)
  } catch (error) {
    if (isHttpError(error) && error.response.status === 401) {
      handleUnauthorized()
      return
    }

    const message = error instanceof Error ? error.message : "Failed to load spaces"
    store.error = message
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
  return executeWithToastVoid(
    async () => {
      await spacesApi.updateListFields(spaceId, fieldNames)
      await refreshSpaceData(spaceId)
    },
    "List fields updated successfully",
    "Failed to update list fields"
  )
}

export async function updateHiddenCreateFields(spaceId: string, fieldNames: string[]): Promise<void> {
  return executeWithToastVoid(
    async () => {
      await spacesApi.updateHiddenCreateFields(spaceId, fieldNames)
      await refreshSpaceData(spaceId)
    },
    "Hidden fields updated successfully",
    "Failed to update hidden fields"
  )
}

export async function updateNoteDetailTemplate(spaceId: string, template: string | null): Promise<void> {
  return executeWithToastVoid(
    async () => {
      await spacesApi.updateNoteDetailTemplate(spaceId, template)
      await refreshSpaceData(spaceId)
    },
    "Note detail template updated successfully",
    "Failed to update note detail template"
  )
}

export async function updateNoteListTemplate(spaceId: string, template: string | null): Promise<void> {
  return executeWithToastVoid(
    async () => {
      await spacesApi.updateNoteListTemplate(spaceId, template)
      await refreshSpaceData(spaceId)
    },
    "Note list template updated successfully",
    "Failed to update note list template"
  )
}

export async function createFilter(spaceId: string, filter: Filter): Promise<void> {
  return executeWithToastVoid(
    async () => {
      await spacesApi.createFilter(spaceId, filter)
      await refreshSpaceData(spaceId)
    },
    "Filter created successfully",
    "Failed to create filter"
  )
}

export async function deleteFilter(spaceId: string, filterId: string): Promise<void> {
  return executeWithToastVoid(
    async () => {
      await spacesApi.deleteFilter(spaceId, filterId)
      await refreshSpaceData(spaceId)
    },
    "Filter deleted successfully",
    "Failed to delete filter"
  )
}

export async function exportSpace(spaceId: string, includeContent = false): Promise<unknown | null> {
  return executeWithToast(
    async () => {
      return await spacesApi.exportSpace(spaceId, includeContent)
    },
    "Space exported successfully",
    "Failed to export space"
  )
}

export async function importSpace(data: unknown): Promise<ImportResult | null> {
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

export async function createField(spaceId: string, field: SpaceField): Promise<void> {
  return executeWithToastVoid(
    async () => {
      await spacesApi.createField(spaceId, field)
      await refreshSpaceData(spaceId)
    },
    "Field created successfully",
    "Failed to create field"
  )
}

export function getSpace(spaceId: string): Space | undefined {
  return useSpacesStore.getState().spaces.find(space => space.id === spaceId)
}

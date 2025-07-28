import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Space } from "@/lib/api/spaces"

interface SpacesState {
  spaces: Space[]
  isLoading: boolean
  error: string | null

  getSpace: (spaceId: string) => Space | undefined
}

export const useSpacesStore = create<SpacesState>()(
  persist(
    (set, get) => ({
      spaces: [],
      isLoading: false,
      error: null,

      getSpace: (spaceId: string) => {
        return get().spaces.find(space => space.id === spaceId)
      },
    }),
    {
      name: "spacenote-spaces",
      partialize: state => ({ spaces: state.spaces }),
    }
  )
)

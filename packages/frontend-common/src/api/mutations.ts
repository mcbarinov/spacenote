import { useMutation, useQueryClient } from "@tanstack/react-query"
import { httpClient } from "./httpClient"
import type { CreateSpaceRequest, CreateUserRequest, LoginRequest, Space, SpaceField, User } from "../types"

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: LoginRequest) => httpClient.post("api/v1/auth/login", { json: credentials }),
    onSuccess: async () => {
      // Cookie is set automatically by the server
      // Invalidate and refetch all queries after login
      await queryClient.invalidateQueries()
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: () => httpClient.post("api/v1/auth/logout"),
    onSuccess: () => {
      // Cookie is cleared automatically by the server
      // NOTE: We don't clear the queryClient cache here because:
      // 1. Navigation to /login happens immediately in the component's onSuccess
      // 2. Protected data is not used on the login page
      // 3. Fresh data will be loaded by _auth.beforeLoad on next login
      // 4. Clearing cache here causes race condition: Header re-renders and tries
      //    to fetch currentUser, gets 401, triggers unnecessary error handling
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserRequest) => httpClient.post("api/v1/users", { json: data }).json<User>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => httpClient.delete(`api/v1/users/${username}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useCreateSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSpaceRequest) => httpClient.post("api/v1/spaces", { json: data }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useDeleteSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slug: string) => httpClient.delete(`api/v1/spaces/${slug}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useAddField(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (field: SpaceField) => httpClient.post(`api/v1/spaces/${spaceSlug}/fields`, { json: field }).json<Space>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

export function useDeleteField(spaceSlug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fieldName: string) => httpClient.delete(`api/v1/spaces/${spaceSlug}/fields/${fieldName}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })
}

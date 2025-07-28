import { usersApi, type CreateUserRequest } from "@/lib/api/users"
import { authApi } from "@/lib/api/auth"
import { executeWithToastVoid } from "@/lib/serviceHelpers"

export async function createUser(username: string, password: string): Promise<void> {
  const data: CreateUserRequest = { username, password }
  await executeWithToastVoid(
    () => usersApi.createUser(data).then(() => {}), // Convert to void
    "User created successfully",
    "Failed to create user"
  )
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await executeWithToastVoid(
    () => authApi.changePassword({ currentPassword, newPassword }).then(() => {}), // Convert to void
    "Password changed successfully",
    "Failed to change password"
  )
}

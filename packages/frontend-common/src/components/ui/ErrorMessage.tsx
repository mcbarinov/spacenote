import { Alert } from "@mantine/core"
import { AppError } from "../../errors/AppError"

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null

  const appError = AppError.fromUnknown(error)

  return <Alert color="red">{appError.message}</Alert>
}

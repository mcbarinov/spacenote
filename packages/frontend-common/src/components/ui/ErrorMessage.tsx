import { Alert, type AlertProps } from "@mantine/core"
import { AppError } from "../../errors/AppError"

interface ErrorMessageProps extends Omit<AlertProps, "children" | "color"> {
  error: unknown
}

export function ErrorMessage({ error, ...props }: ErrorMessageProps) {
  if (!error) return null

  const appError = AppError.fromUnknown(error)

  return (
    <Alert color="red" {...props}>
      {appError.message}
    </Alert>
  )
}

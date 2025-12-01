import { Alert, type AlertProps } from "@mantine/core"
import { AppError } from "../../errors/AppError"

/** Props for error message display */
interface ErrorMessageProps extends Omit<AlertProps, "children" | "color"> {
  error: unknown
}

/** Displays error as alert, converts unknown to AppError */
export function ErrorMessage({ error, ...props }: ErrorMessageProps) {
  if (!error) return null

  const appError = AppError.fromUnknown(error)

  return (
    <Alert color="red" {...props}>
      {appError.message}
    </Alert>
  )
}

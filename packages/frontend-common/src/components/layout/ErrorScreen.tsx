import { Alert, Center } from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { AppError } from "../../errors"

export function ErrorScreen({ error }: { error: Error }) {
  const appError = AppError.fromUnknown(error)
  return (
    <Center h="100vh" p="md">
      <Alert icon={<IconAlertCircle />} title={appError.title} color="red" maw={800}>
        {appError.message}
      </Alert>
    </Center>
  )
}

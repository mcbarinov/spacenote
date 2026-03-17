import { Center, Loader } from "@mantine/core"

/** Full-screen loading indicator */
export function LoadingScreen() {
  return (
    <Center h="100vh">
      <Loader />
    </Center>
  )
}

import { Component, type ReactNode } from "react"
import { Alert, Container } from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { AppError } from "../../errors/AppError"

/** Props for ErrorBoundary component */
interface Props {
  children: ReactNode
  /** Key to reset error state on change */
  resetKey?: unknown
  /** Callback when unauthorized error is caught */
  onUnauthorized?: () => void
}

/** Error boundary that catches render errors and displays alert */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Error caught by boundary:", error, errorInfo)
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      const appError = AppError.fromUnknown(this.state.error)

      // Handle unauthorized with callback
      if (appError.code === "unauthorized" && this.props.onUnauthorized) {
        this.props.onUnauthorized()
        return null
      }

      return (
        <Container p="md">
          <Alert icon={<IconAlertCircle />} title={appError.title} color="red" maw={800} mx="auto">
            {appError.message}
          </Alert>
        </Container>
      )
    }

    return this.props.children
  }
}

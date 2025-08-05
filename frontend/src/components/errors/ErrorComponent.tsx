import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorComponentProps {
  error: Error
  reset?: () => void
}

export function ErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-red-600">Something went wrong</CardTitle>
          <CardDescription>An error occurred while loading this page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-800 font-mono">{error.message}</p>
          </div>
          {reset && (
            <Button onClick={reset} variant="outline" className="w-full">
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

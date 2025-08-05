import { createFileRoute } from "@tanstack/react-router"
import { useAuth } from "@/auth"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_authenticated/spaces")({
  component: SpacesPage,
})

function SpacesPage() {
  const auth = useAuth()

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Spaces</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {auth.user?.username}</span>
          <Button variant="outline" onClick={() => void auth.logout().then(() => (window.location.href = "/login"))}>
            Logout
          </Button>
        </div>
      </div>
      <p className="text-gray-600">Your spaces will appear here.</p>
    </div>
  )
}

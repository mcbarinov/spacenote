import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { username, logout } = useAuth()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SpaceNote</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Logged in as <strong>{username}</strong>
            </span>
            <Button onClick={logout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>

        <div className="text-center py-16">
          <p className="text-xl text-gray-600">Welcome to SpaceNote!</p>
          <p className="text-gray-500 mt-2">Your flexible note-taking system</p>
        </div>
      </div>
    </div>
  )
}

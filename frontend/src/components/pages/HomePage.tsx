import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import type { Space } from "@/types"

export default function HomePage() {
  const queryClient = useQueryClient()
  // Get spaces from cache since they're already loaded in AuthLayout
  const spaces = queryClient.getQueryData<Space[]>(["spaces"]) ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Spaces</h1>
      {spaces.length > 0 ? (
        <ul className="space-y-2">
          {spaces.map((space) => (
            <li key={space.id}>
              <Link to={`/s/${space.slug}`} className="text-lg text-blue-600 hover:text-blue-800 hover:underline">
                {space.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No spaces yet. Create your first space to get started.</p>
      )}
    </div>
  )
}

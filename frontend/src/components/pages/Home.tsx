import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SpaceMenu } from "@/components/shared/SpaceMenu"
import type { Space } from "@/types"

export default function HomePage() {
  const queryClient = useQueryClient()
  // Get spaces from cache since they're already loaded in AuthLayout
  const spaces = queryClient.getQueryData<Space[]>(["spaces"]) ?? []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Spaces</h1>
        <Button asChild>
          <Link to="/spaces/new">
            <Plus className="h-4 w-4 mr-2" />
            New Space
          </Link>
        </Button>
      </div>

      {spaces.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Card key={space.slug} className="relative hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>
                      <Link to={`/s/${space.slug}`} className="hover:text-primary">
                        {space.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-1">{space.slug}</CardDescription>
                  </div>
                  <SpaceMenu space={space} />
                </div>
              </CardHeader>
              <CardContent>
                <Link to={`/s/${space.slug}`} className="text-sm text-muted-foreground hover:text-primary">
                  View Notes →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No spaces yet. Create your first space to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

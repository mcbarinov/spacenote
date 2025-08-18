import { useSuspenseQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { spacesQueryOptions } from "@/lib/queries"

export default function HomePage() {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Spaces</h1>
      {spaces.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Link key={space.id} to={`/spaces/${space.slug}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{space.title}</CardTitle>
                  {space.fields.length > 0 && (
                    <CardDescription>
                      {space.fields.length} field{space.fields.length !== 1 ? "s" : ""}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {space.members.length} member{space.members.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No spaces yet. Create your first space to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

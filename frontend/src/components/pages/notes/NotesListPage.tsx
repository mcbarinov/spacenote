import { useParams, Link } from "react-router"
import { useSpace } from "@/hooks/useSpace"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function NotesListPage() {
  const { slug } = useParams() as { slug: string }
  const space = useSpace(slug)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{space.title}</h1>
        <Link to={`/s/${slug}/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Notes for this space will be displayed here. This feature is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}

import { useParams } from "react-router"
import { useSpace } from "@/hooks/useSpace"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotesListPage() {
  const { slug } = useParams() as { slug: string }
  const space = useSpace(slug)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{space.title}</h1>
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

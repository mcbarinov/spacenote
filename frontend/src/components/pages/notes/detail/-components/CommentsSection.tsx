import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CommentList } from "./CommentList"
import { CommentForm } from "./CommentForm"

interface CommentsSectionProps {
  spaceSlug: string
  noteNumber: number
}

export function CommentsSection({ spaceSlug, noteNumber }: CommentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Suspense fallback={<CommentsSkeleton />}>
          <CommentList spaceSlug={spaceSlug} noteNumber={noteNumber} />
        </Suspense>
        <div className="border-t pt-6">
          <CommentForm spaceSlug={spaceSlug} noteNumber={noteNumber} />
        </div>
      </CardContent>
    </Card>
  )
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
      ))}
    </div>
  )
}

import { useSuspenseQuery } from "@tanstack/react-query"
import { commentsQueryOptions } from "@/lib/queries"
import { formatDate } from "@/lib/format"
import { UserDisplay } from "@/components/UserDisplay"
import { Card } from "@/components/ui/card"

interface CommentListProps {
  spaceSlug: string
  noteNumber: number
}

export function CommentList({ spaceSlug, noteNumber }: CommentListProps) {
  const { data: comments } = useSuspenseQuery(commentsQueryOptions(spaceSlug, noteNumber))
  if (comments.length === 0) {
    return <div className="text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</div>
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserDisplay userId={comment.author_id} />
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">#{comment.number}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{formatDate(comment.created_at)}</span>
            </div>
          </div>
          <div className="whitespace-pre-wrap">{comment.content}</div>
        </Card>
      ))}
    </div>
  )
}

import { useState } from "react"
import { Pagination, Paper, Stack, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { api, COMMENTS_PAGE_LIMIT } from "@spacenote/common/api"

interface CommentListProps {
  spaceSlug: string
  noteNumber: number
}

export function CommentList({ spaceSlug, noteNumber }: CommentListProps) {
  const [page, setPage] = useState(1)
  const { data } = useQuery(api.queries.listComments(spaceSlug, noteNumber, page, COMMENTS_PAGE_LIMIT))

  if (!data || data.total === 0) {
    return (
      <Text c="dimmed" size="sm">
        No comments yet
      </Text>
    )
  }

  const totalPages = Math.ceil(data.total / COMMENTS_PAGE_LIMIT)

  return (
    <Stack gap="sm">
      {data.items.map((comment) => (
        <Paper key={comment.number} p="sm" withBorder>
          <Text size="sm" c="dimmed" mb="xs">
            {comment.author} · {new Date(comment.created_at).toLocaleString()}
          </Text>
          <Text>{comment.content}</Text>
        </Paper>
      ))}
      {totalPages > 1 && <Pagination total={totalPages} value={page} onChange={setPage} mt="md" />}
    </Stack>
  )
}

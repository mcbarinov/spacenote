import { createFileRoute } from "@tanstack/react-router"
import { Divider, Title } from "@mantine/core"
import { useSuspenseQuery } from "@tanstack/react-query"
import { api, COMMENTS_PAGE_LIMIT } from "@spacenote/common/api"
import { SpaceHeader } from "@/components/SpaceHeader"
import { CommentForm } from "./-components/CommentForm"
import { CommentList } from "./-components/CommentList"
import { NoteDetails } from "./-components/NoteDetails"

export const Route = createFileRoute("/_auth/s/$slug/$noteNumber/")({
  loader: async ({ context, params }) => {
    const noteNumber = Number(params.noteNumber)
    await Promise.all([
      context.queryClient.ensureQueryData(api.queries.getNote(params.slug, noteNumber)),
      context.queryClient.ensureQueryData(api.queries.listComments(params.slug, noteNumber, 1, COMMENTS_PAGE_LIMIT)),
    ])
  },
  component: NoteDetailPage,
})

/** Note detail page with fields and comments */
function NoteDetailPage() {
  const { slug, noteNumber } = Route.useParams()
  const noteNum = Number(noteNumber)
  const space = api.cache.useSpace(slug)
  const { data: note } = useSuspenseQuery(api.queries.getNote(slug, noteNum))

  return (
    <>
      <SpaceHeader space={space} note={{ number: note.number }} title={`Note #${String(note.number)}`} />

      <NoteDetails note={note} space={space} />

      <Divider my="lg" />

      <Title order={2} mb="md">
        Comments
      </Title>
      <CommentForm spaceSlug={slug} noteNumber={noteNum} />
      <Divider my="lg" />
      <CommentList spaceSlug={slug} noteNumber={noteNum} />
    </>
  )
}

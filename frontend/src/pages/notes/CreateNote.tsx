import { useParams, useNavigate } from "react-router"
import { useState } from "react"
import { useSpacesStore } from "@/stores/spacesStore"
import { notesApi } from "@/lib/api/notes"
import { NoteForm } from "./components/NoteForm"
import { PageHeader } from "@/components/PageHeader"

export default function CreateNote() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const navigate = useNavigate()
  const space = useSpacesStore(state => state.getSpace(spaceId || ""))
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (fields: Record<string, string>) => {
    if (!spaceId) return

    setLoading(true)
    const createdNote = await notesApi.createNote(spaceId, fields)
    navigate(`/notes/${spaceId}/${createdNote.id}`)
    setLoading(false)
  }

  const handleCancel = () => {
    navigate(`/notes/${spaceId}`)
  }

  if (!space) {
    return <div className="mt-4">Loading...</div>
  }

  return (
    <div>
      <PageHeader title="New Note" subtitle={space.name} />
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <NoteForm space={space} onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      </div>
    </div>
  )
}

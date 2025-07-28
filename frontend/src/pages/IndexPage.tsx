import { useEffect } from "react"
import { useNavigate } from "react-router"
import { useSpacesStore } from "@/stores/spacesStore"
import { loadSpaces } from "@/services/spaceService"
import { PageHeader } from "@/components/PageHeader"

export default function IndexPage() {
  const navigate = useNavigate()
  const { spaces, isLoading, error } = useSpacesStore()

  useEffect(() => {
    loadSpaces()
  }, [])

  useEffect(() => {
    if (!isLoading && spaces.length > 0) {
      navigate(`/notes/${spaces[0].id}`, { replace: true })
    }
  }, [isLoading, spaces, navigate])

  if (isLoading) return <div>Loading your spaces...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="text-center max-w-md mx-auto">
      <PageHeader title="Welcome to SpaceNote!" />
      <p className="text-gray-600">You don't have any spaces yet. Contact your administrator to create your first space.</p>
    </div>
  )
}

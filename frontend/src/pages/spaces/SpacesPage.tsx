import { useSpacesStore } from "@/stores/spacesStore"
import { useAuthStore } from "@/stores/authStore"
import { deleteSpace } from "@/services/spaceService"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Trash2, Users, Layers, Filter, MessageSquare, Settings } from "lucide-react"
import { useDialog } from "@/lib/dialog"
import { Link, useNavigate } from "react-router"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/PageHeader"
import { useState } from "react"

export default function SpacesPage() {
  const { spaces, isLoading, error } = useSpacesStore()
  const { userId } = useAuthStore()
  const dialog = useDialog()
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [spaceToDelete, setSpaceToDelete] = useState<string | null>(null)

  const isAdmin = userId === "admin"

  const handleDeleteClick = (spaceId: string) => {
    setSpaceToDelete(spaceId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!spaceToDelete) return

    try {
      await deleteSpace(spaceToDelete)
      setDeleteDialogOpen(false)
      setSpaceToDelete(null)
    } catch (error) {
      console.error("Failed to delete space:", error)
    }
  }

  if (isLoading) return <div>Loading spaces...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <PageHeader
        title="Spaces"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/spaces/import")}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => dialog.open("createSpace")}>Create</Button>
          </>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {spaces.map(space => (
            <TableRow key={space.id}>
              <TableCell className="font-mono text-sm">{space.id}</TableCell>
              <TableCell>{space.name}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <Users className="mr-2 h-4 w-4" />
                      Members ({space.members.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/spaces/${space.id}/fields`}>
                        <Layers className="mr-2 h-4 w-4" />
                        Fields ({space.fields.length})
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/spaces/${space.id}/filters`}>
                        <Filter className="mr-2 h-4 w-4" />
                        Filters ({space.filters.length})
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Telegram ({space.telegram?.enabled ? "Enabled" : "Disabled"})
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/spaces/${space.id}/export`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(space.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Space</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the space "{spaceToDelete}"? This action cannot be undone and will permanently
              delete all notes, comments, and attachments in this space.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete Space
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

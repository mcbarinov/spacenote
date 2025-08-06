import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { MoreHorizontalIcon } from "lucide-react"

import { spacesQueryOptions } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { CreateSpaceDialog } from "./-components/CreateSpaceDialog"

export const Route = createFileRoute("/spaces_/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(spacesQueryOptions()),
  component: SpacesPage,
})

function SpacesPage() {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Spaces</h1>
        <CreateSpaceDialog trigger={<Button>Create New Space</Button>} />
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No spaces yet.</p>
          <p className="text-sm text-gray-500">Create your first space to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spaces.map((space) => (
                <TableRow key={space.id}>
                  <TableCell className="font-mono text-sm">{space.id}</TableCell>
                  <TableCell className="font-medium">{space.name}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to="/spaces/$spaceId/fields" params={{ spaceId: space.id }}>
                            Fields ({space.fields?.length || 0})
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit Space</DropdownMenuItem>
                        <DropdownMenuItem>Manage Members</DropdownMenuItem>
                        <DropdownMenuItem>View Settings</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive">Delete Space</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

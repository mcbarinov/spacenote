import { Link, Navigate } from "react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { usersQueryOptions } from "@/lib/queries"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function UserList() {
  const { username } = useAuth()
  const { data: users } = useSuspenseQuery(usersQueryOptions())

  // Only admin can access this page
  if (username !== "admin") {
    return <Navigate to="/" replace />
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link to="/users/new">
          <Button>Add User</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.username}>
                <TableCell className="font-medium">{user.username}</TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell className="text-center text-muted-foreground">No users found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

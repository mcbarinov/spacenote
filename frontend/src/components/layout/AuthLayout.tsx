import { Suspense } from "react"
import { Navigate, Outlet, useNavigate, Link } from "react-router"
import { ErrorBoundary } from "react-error-boundary"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { usersQueryOptions, spacesQueryOptions } from "@/lib/queries"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { Loading } from "@/components/ui/loading"

export default function AuthLayout() {
  const { isAuthenticated, username, logout } = useAuth()
  const navigate = useNavigate()

  // Load users and spaces data once for the entire app
  useSuspenseQuery(usersQueryOptions())
  useSuspenseQuery(spacesQueryOptions())

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    logout()
    void navigate("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold hover:text-primary">
            SpaceNote
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {username ?? "User"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  void navigate("/spaces")
                }}
              >
                Spaces
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  void navigate("/change-password")
                }}
              >
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <ErrorBoundary
          fallback={
            <div className="text-center py-8">
              <p className="text-destructive mb-4">Something went wrong!</p>
              <Button
                onClick={() => {
                  window.location.reload()
                }}
              >
                Reload page
              </Button>
            </div>
          }
        >
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          SpaceNote © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}

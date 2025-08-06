import { Link, Outlet } from "@tanstack/react-router"
import { ChevronDownIcon, UserIcon } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { useAuthUser } from "@/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { spacesQueryOptions, useRefreshSpacesMutation } from "@/lib/queries"

export function AuthenticatedLayout() {
  const { user, logout } = useAuthUser()
  const queryClient = useQueryClient()
  const refreshSpacesMutation = useRefreshSpacesMutation()

  useEffect(() => {
    void queryClient.prefetchQuery(spacesQueryOptions())
  }, [queryClient])

  const handleLogout = async () => {
    await logout()
  }

  const handleRefreshSpaces = () => {
    refreshSpacesMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">SpaceNote</h1>
            <nav className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <Link
                  to="/spaces"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                  activeProps={{ className: "text-gray-900" }}
                >
                  Spaces
                </Link>
                <Link
                  to="/notes"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                  activeProps={{ className: "text-gray-900" }}
                >
                  Notes
                </Link>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium">
                  <UserIcon className="w-5 h-5" />
                  <span>{user.username}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleRefreshSpaces}>Refresh Spaces</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

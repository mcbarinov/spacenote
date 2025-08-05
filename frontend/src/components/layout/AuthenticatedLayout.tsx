import { Outlet } from "@tanstack/react-router"

import { useAuthUser } from "@/auth"

export function AuthenticatedLayout() {
  const { user, logout } = useAuthUser()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">SpaceNote</h1>
            <nav className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.username}</span>
              <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 font-medium">
                Logout
              </button>
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

import { useNavigate, Link } from "react-router"
import { useAuthStore } from "@/stores/authStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, User } from "lucide-react"
import { useDialog } from "@/lib/dialog"

export default function UserMenu() {
  const navigate = useNavigate()
  const { userId, logout } = useAuthStore()
  const dialog = useDialog()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handleChangePassword = async () => {
    const result = await dialog.open("changePassword")
    // Only logout if password was actually changed (dialog returns a result)
    if (result) {
      logout()
      navigate("/login")
    }
  }

  const handleManageUsers = () => {
    dialog.open("userManagement")
  }

  const isAdmin = userId === "admin"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2">
        <User className="w-4 h-4" />
        {userId}
        <ChevronDown className="w-3 h-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/spaces">Manage Spaces</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={handleManageUsers}>Manage Users</DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleChangePassword}>Change Password</DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

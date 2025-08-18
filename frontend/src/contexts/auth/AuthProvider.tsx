import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router"
import { api } from "@/lib/api"
import { AuthContext } from "./AuthContext"

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    const authToken = localStorage.getItem("auth_token")

    if (storedUsername && authToken) {
      setUsername(storedUsername)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const response = await api.auth.login({ username, password })

    localStorage.setItem("auth_token", response.auth_token)
    localStorage.setItem("username", response.user.username)
    setUsername(response.user.username)
  }

  const logout = () => {
    api.auth.logout()
    localStorage.removeItem("auth_token")
    localStorage.removeItem("username")
    setUsername(null)
    navigate("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        username,
        isAuthenticated: !!username,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

import type { User } from "@/types"

// Session storage keys
const SESSION_KEY = "spacenote.auth.session"
const USER_KEY = "spacenote.auth.user"

export function getStoredSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function setStoredSessionId(sessionId: string | null) {
  if (sessionId) {
    localStorage.setItem(SESSION_KEY, sessionId)
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr) as User
  } catch {
    return null
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export function clearAuthData() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(USER_KEY)
}

import { useUser } from "@/hooks/useUser"

interface UserDisplayProps {
  userId: string
}

/**
 * Component to display a username for a given user ID.
 * Falls back to showing the ID if user lookup fails.
 */
export function UserDisplay({ userId }: UserDisplayProps) {
  try {
    const user = useUser(userId)
    return <>{user.username}</>
  } catch {
    // If user not found, just show the ID
    return <>{userId}</>
  }
}
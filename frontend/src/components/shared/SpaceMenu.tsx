import { Link } from "react-router"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Space } from "@/types"

interface SpaceMenuProps {
  space: Space
  triggerClassName?: string
}

export function SpaceMenu({ space, triggerClassName }: SpaceMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={triggerClassName ?? "h-8 w-8"}>
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={`/spaces/${space.slug}/members`}>Members ({space.member_usernames.length})</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/spaces/${space.slug}/fields`}>Fields ({space.fields.length})</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/spaces/${space.slug}/filters`}>Filters ({space.filters.length})</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/spaces/${space.slug}/templates`}>Templates</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/spaces/${space.slug}/export`}>Export</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/spaces/${space.slug}/settings`}>Settings</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

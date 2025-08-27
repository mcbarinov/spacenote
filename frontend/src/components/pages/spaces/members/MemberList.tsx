import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { spacesQueryOptions, useUpdateSpaceMembersMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function MemberList() {
  const { slug } = useParams()
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())
  const updateMembersMutation = useUpdateSpaceMembersMutation(slug ?? "")

  const space = spaces.find((s) => s.slug === slug)
  const [membersInput, setMembersInput] = useState("")

  useEffect(() => {
    if (space) {
      const memberUsernames = space.member_usernames.join(", ")
      setMembersInput(memberUsernames)
    }
  }, [space])

  if (!space) {
    return <div>Space not found</div>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const usernames = membersInput
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)

    if (usernames.length === 0) {
      toast.error("Please enter at least one username")
      return
    }

    updateMembersMutation.mutate(usernames, {
      onSuccess: () => {
        toast.success("Members updated successfully")
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update members")
      },
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Members</h1>
      <p className="text-muted-foreground mb-6">Space: {space.title}</p>

      <form
        onSubmit={(e) => {
          handleSubmit(e)
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="members">Members (comma-separated usernames)</Label>
          <Input
            id="members"
            type="text"
            value={membersInput}
            onChange={(e) => {
              setMembersInput(e.target.value)
            }}
            placeholder="admin, alice, bob"
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">Enter usernames separated by commas</p>
        </div>

        <Button type="submit" disabled={updateMembersMutation.isPending}>
          {updateMembersMutation.isPending ? "Updating..." : "Update Members"}
        </Button>
      </form>
    </div>
  )
}

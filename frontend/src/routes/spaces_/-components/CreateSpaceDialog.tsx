import { useState } from "react"
import { toast } from "sonner"
import { useCreateSpaceMutation } from "@/lib/queries"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateSpaceDialogProps {
  trigger: React.ReactNode
}

export function CreateSpaceDialog({ trigger }: CreateSpaceDialogProps) {
  const [open, setOpen] = useState(false)
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const createSpaceMutation = useCreateSpaceMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createSpaceMutation.mutateAsync({ id, name })
      toast.success("Space created successfully!")
      setOpen(false)
      setId("")
      setName("")
    } catch (error) {
      console.error("Failed to create space:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create space")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
            <DialogDescription>
              Create a new space to organize your notes. Choose a unique ID and descriptive name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id" className="text-right">
                ID
              </Label>
              <Input
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="col-span-3"
                placeholder="my-space"
                required
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="My Space"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createSpaceMutation.isPending}>
              {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

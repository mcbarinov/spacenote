import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { useCreateSpaceMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface CreateSpaceDialogProps {
  trigger: React.ReactElement
}

const formSchema = z.object({
  id: z
    .string()
    .min(1, "Space ID is required")
    .regex(/^[a-z0-9-]+$/, "Space ID must contain only lowercase letters, numbers, and hyphens"),
  name: z.string().min(1, "Space name is required"),
})

export function CreateSpaceDialog({ trigger }: CreateSpaceDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      name: "",
    },
  })

  const createSpaceMutation = useCreateSpaceMutation()

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    createSpaceMutation.mutate(data, {
      onSuccess: () => {
        form.reset()
        setOpen(false)
        toast.success("Space created successfully!")
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  const handleCancel = () => {
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>Create a new space to organize your notes and content.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void form.handleSubmit(handleSubmit)(e)
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., my-tasks" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., My Task List" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSpaceMutation.isPending}>
                {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

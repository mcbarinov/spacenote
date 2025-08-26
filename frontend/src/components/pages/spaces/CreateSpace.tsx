import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCreateSpaceMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useNavigate } from "react-router"
import { toast } from "sonner"

const createSpaceSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
})

type CreateSpaceForm = z.infer<typeof createSpaceSchema>

export default function CreateSpace() {
  const createSpaceMutation = useCreateSpaceMutation()
  const navigate = useNavigate()

  const form = useForm<CreateSpaceForm>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      slug: "",
      title: "",
    },
  })

  const onSubmit = (data: CreateSpaceForm) => {
    createSpaceMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Space created successfully")
        void navigate("/")
      },
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Create New Space</h1>

      <Form {...form}>
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="my-space" {...field} disabled={createSpaceMutation.isPending} autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="My Space" {...field} disabled={createSpaceMutation.isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={createSpaceMutation.isPending}>
            {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
          </Button>
        </form>
      </Form>
    </div>
  )
}

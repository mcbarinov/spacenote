import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCreateSpaceMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const createSpaceSchema = z.object({
  slug: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
})

type CreateSpaceForm = z.infer<typeof createSpaceSchema>

export default function SpaceNewPage() {
  const createSpaceMutation = useCreateSpaceMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSpaceForm>({
    resolver: zodResolver(createSpaceSchema),
  })

  const onSubmit = (data: CreateSpaceForm) => {
    createSpaceMutation.mutate(data)
  }

  return (
    <div className="container mx-auto p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Create New Space</h1>

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" placeholder="my-space" {...register("slug")} disabled={createSpaceMutation.isPending} />
          {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>}
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="My Space" {...register("title")} disabled={createSpaceMutation.isPending} />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <Button type="submit" disabled={createSpaceMutation.isPending}>
          {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
        </Button>
      </form>
    </div>
  )
}

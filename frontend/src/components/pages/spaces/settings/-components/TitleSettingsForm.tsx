import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUpdateSpaceTitleMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import type { Space } from "@/types"

const titleFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
})

type TitleFormData = z.infer<typeof titleFormSchema>

interface TitleSettingsFormProps {
  space: Space
}

export function TitleSettingsForm({ space }: TitleSettingsFormProps) {
  const updateTitleMutation = useUpdateSpaceTitleMutation(space.slug)

  const form = useForm<TitleFormData>({
    resolver: zodResolver(titleFormSchema),
    defaultValues: {
      title: space.title,
    },
  })

  useEffect(() => {
    form.reset({ title: space.title })
  }, [space.title, form])

  const handleSubmit = (data: TitleFormData) => {
    updateTitleMutation.mutate(data.title, {
      onSuccess: () => {
        toast.success("Title updated successfully")
      },
      onError: () => {
        toast.error("Failed to update title")
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Space Title</CardTitle>
        <CardDescription>The display name for this space</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateTitleMutation.isPending}>
              {updateTitleMutation.isPending ? "Saving..." : "Save Title"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

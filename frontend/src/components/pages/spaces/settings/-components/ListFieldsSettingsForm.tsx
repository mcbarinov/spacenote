import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUpdateSpaceListFieldsMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import type { Space } from "@/types"

const listFieldsFormSchema = z.object({
  listFields: z.string(),
})

type ListFieldsFormData = z.infer<typeof listFieldsFormSchema>

interface ListFieldsSettingsFormProps {
  space: Space
}

export function ListFieldsSettingsForm({ space }: ListFieldsSettingsFormProps) {
  const updateListFieldsMutation = useUpdateSpaceListFieldsMutation(space.slug)

  const form = useForm<ListFieldsFormData>({
    resolver: zodResolver(listFieldsFormSchema),
    defaultValues: {
      listFields: space.list_fields.join(", "),
    },
  })

  useEffect(() => {
    form.reset({ listFields: space.list_fields.join(", ") })
  }, [space.list_fields, form])

  const handleSubmit = (data: ListFieldsFormData) => {
    const fields = data.listFields
      .split(",")
      .map((field) => field.trim())
      .filter((field) => field.length > 0)

    updateListFieldsMutation.mutate(fields, {
      onSuccess: () => {
        toast.success("List fields updated successfully")
      },
      onError: () => {
        toast.error("Failed to update list fields")
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>List View Fields</CardTitle>
        <CardDescription>Fields to display in the notes list view (order matters)</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)} className="space-y-4">
            <FormField
              control={form.control}
              name="listFields"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fields</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="title, status, priority" />
                  </FormControl>
                  <FormDescription>Enter field names separated by commas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateListFieldsMutation.isPending}>
              {updateListFieldsMutation.isPending ? "Saving..." : "Save List Fields"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

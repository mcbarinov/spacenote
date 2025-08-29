import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUpdateSpaceHiddenCreateFieldsMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import type { Space } from "@/types"

const hiddenFieldsFormSchema = z.object({
  hiddenCreateFields: z.string(),
})

type HiddenFieldsFormData = z.infer<typeof hiddenFieldsFormSchema>

interface HiddenFieldsSettingsFormProps {
  space: Space
}

export function HiddenFieldsSettingsForm({ space }: HiddenFieldsSettingsFormProps) {
  const updateHiddenFieldsMutation = useUpdateSpaceHiddenCreateFieldsMutation(space.slug)

  const form = useForm<HiddenFieldsFormData>({
    resolver: zodResolver(hiddenFieldsFormSchema),
    defaultValues: {
      hiddenCreateFields: space.hidden_create_fields.join(", "),
    },
  })

  useEffect(() => {
    form.reset({ hiddenCreateFields: space.hidden_create_fields.join(", ") })
  }, [space.hidden_create_fields, form])

  const handleSubmit = (data: HiddenFieldsFormData) => {
    const fields = data.hiddenCreateFields
      .split(",")
      .map((field) => field.trim())
      .filter((field) => field.length > 0)

    updateHiddenFieldsMutation.mutate(fields, {
      onSuccess: () => {
        toast.success("Hidden fields updated successfully")
      },
      onError: () => {
        toast.error("Failed to update hidden fields")
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hidden Create Fields</CardTitle>
        <CardDescription>Fields to hide in the note creation form</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)} className="space-y-4">
            <FormField
              control={form.control}
              name="hiddenCreateFields"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fields</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="assignee, tags" />
                  </FormControl>
                  <FormDescription>Enter field names separated by commas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateHiddenFieldsMutation.isPending}>
              {updateHiddenFieldsMutation.isPending ? "Saving..." : "Save Hidden Fields"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

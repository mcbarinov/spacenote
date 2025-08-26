import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useCreateCommentMutation } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000, "Comment is too long"),
})

type CommentFormData = z.infer<typeof commentSchema>

interface CommentFormProps {
  spaceSlug: string
  noteNumber: number
}

export function CommentForm({ spaceSlug, noteNumber }: CommentFormProps) {
  const createCommentMutation = useCreateCommentMutation(spaceSlug, noteNumber)
  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  })

  const handleSubmit = (data: CommentFormData) => {
    createCommentMutation.mutate(
      { content: data.content },
      {
        onSuccess: () => {
          toast.success("Comment posted successfully")
          form.reset()
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="Write a comment..." className="min-h-[80px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createCommentMutation.isPending}>
          {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
        </Button>
      </form>
    </Form>
  )
}

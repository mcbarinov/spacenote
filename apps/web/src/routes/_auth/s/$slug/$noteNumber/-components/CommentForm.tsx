import { Button, Group, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { api } from "@spacenote/common/api"
import { ErrorMessage } from "@spacenote/common/components"

interface CommentFormProps {
  spaceSlug: string
  noteNumber: number
}

export function CommentForm({ spaceSlug, noteNumber }: CommentFormProps) {
  const createCommentMutation = api.mutations.useCreateComment(spaceSlug, noteNumber)

  const form = useForm({
    initialValues: {
      content: "",
    },
  })

  const handleSubmit = form.onSubmit((values) => {
    createCommentMutation.mutate(values, {
      onSuccess: () => {
        form.reset()
      },
    })
  })

  return (
    <form onSubmit={handleSubmit}>
      <Textarea placeholder="Write a comment..." minRows={2} {...form.getInputProps("content")} mb="sm" />
      {createCommentMutation.error && <ErrorMessage error={createCommentMutation.error} mb="sm" />}
      <Group justify="flex-end">
        <Button type="submit" loading={createCommentMutation.isPending} disabled={!form.values.content.trim()}>
          Add Comment
        </Button>
      </Group>
    </form>
  )
}

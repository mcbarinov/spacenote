import { useParams, Link } from "react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useSpace } from "@/hooks/useSpace"
import { noteQueryOptions } from "@/lib/queries"
import { formatDate } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { UserDisplay } from "@/components/UserDisplay"
import { CommentsSection } from "./-components/CommentsSection"
import type { SpaceField } from "@/types"

export default function NoteDetail() {
  const { slug, number } = useParams() as { slug: string; number: string }
  const space = useSpace(slug)
  const noteNumber = parseInt(number, 10)
  const { data: note } = useSuspenseQuery(noteQueryOptions(slug, noteNumber))

  // Helper function to get field definition
  const getFieldDefinition = (fieldName: string): SpaceField | undefined => {
    return space.fields.find((f) => f.name === fieldName)
  }

  // Helper function to render field value
  const renderFieldValue = (fieldName: string, value: unknown) => {
    const fieldDef = getFieldDefinition(fieldName)

    if (value == null) {
      return <span className="text-muted-foreground">-</span>
    }

    if (fieldDef?.type === "user") {
      return <UserDisplay userId={value as string} />
    }

    if (fieldDef?.type === "markdown") {
      return <div className="whitespace-pre-wrap">{value as string}</div>
    }

    if (fieldDef?.type === "boolean") {
      return value === true ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>
    }

    if (fieldDef?.type === "tags" && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((tag, index) => (
            <Badge key={index} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )
    }

    if (fieldDef?.type === "datetime" && typeof value === "string") {
      return formatDate(value)
    }

    if (Array.isArray(value)) {
      return value.join(", ")
    }

    if (typeof value === "object") {
      return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
    }

    return String(value as string | number | boolean)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {space.title} #{note.number}
        </h1>
        <Link to={`/s/${slug}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle>Note Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Number</div>
                <div className="font-medium">#{note.number}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Author</div>
                <div className="font-medium">{note.author_username}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">{formatDate(note.created_at)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Edited</div>
                <div className="font-medium">{note.edited_at ? formatDate(note.edited_at) : "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fields Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {space.fields.map((field) => (
              <div key={field.name} className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </div>
                <div>{renderFieldValue(field.name, note.fields[field.name])}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Comments Section */}
        <CommentsSection spaceSlug={slug} noteNumber={noteNumber} />
      </div>
    </div>
  )
}

import { useState } from "react"
import { useParams } from "react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { spaceExportQueryOptions } from "@/lib/queries"

export default function ExportPage() {
  const { slug } = useParams() as { slug: string }
  const [includeData, setIncludeData] = useState(false)

  const { data } = useSuspenseQuery(spaceExportQueryOptions(slug, includeData))

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    toast.success("Copied to clipboard")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Export Space</CardTitle>
          <CardDescription>Export space configuration and optionally its data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-data"
              checked={includeData}
              onCheckedChange={(checked) => {
                setIncludeData(checked === true)
              }}
            />
            <Label htmlFor="include-data">Include notes and comments</Label>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Export Data</Label>
              <Button
                size="sm"
                onClick={() => {
                  void handleCopy()
                }}
              >
                Copy to clipboard
              </Button>
            </div>
            <Textarea readOnly value={JSON.stringify(data, null, 2)} className="font-mono text-xs min-h-[400px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

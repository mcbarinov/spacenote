import { useState } from "react"
import { useParams } from "react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Download, Copy, Check } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { spacesApi } from "@/lib/api/spaces"
import { downloadJSON } from "@/lib/download"
import { useSpacesStore } from "@/stores/spacesStore"

export default function SpaceExport() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const { spaces } = useSpacesStore()
  const [includeContent, setIncludeContent] = useState(false)
  const [previewData, setPreviewData] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const space = spaces.find(s => s.id === spaceId)

  const handleDownload = async (withNotes: boolean) => {
    if (!spaceId) return
    const data = await spacesApi.exportSpace(spaceId, withNotes)
    downloadJSON(data, `${spaceId}-export.json`)
  }

  const handlePreview = async () => {
    if (!spaceId) return
    setIsLoading(true)
    const data = await spacesApi.exportSpace(spaceId, includeContent)
    setPreviewData(data)
    setIsLoading(false)
  }

  const handleCopy = async () => {
    if (previewData) {
      await navigator.clipboard.writeText(JSON.stringify(previewData, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!space) {
    return <div>Space not found</div>
  }

  return (
    <div>
      <PageHeader title={`Export ${space.name}`} subtitle="Export your space data in JSON format" />

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="download" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="download">Download</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="download" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Download your space data as a JSON file. You can choose to include just the metadata or include all notes and
                  comments.
                </p>

                <div className="space-y-3">
                  <Button onClick={() => handleDownload(false)} variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download Metadata Only
                    <span className="ml-auto text-xs text-muted-foreground">Space config, fields, filters</span>
                  </Button>

                  <Button onClick={() => handleDownload(true)} className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download with Notes & Comments
                    <span className="ml-auto text-xs text-muted-foreground">Complete export</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="include-content" checked={includeContent} onCheckedChange={setIncludeContent} />
                  <Label htmlFor="include-content">Include notes and comments</Label>
                </div>

                <Button onClick={handlePreview} disabled={isLoading}>
                  {isLoading ? "Loading..." : "Generate Preview"}
                </Button>

                {previewData && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>JSON Preview</Label>
                      <Button variant="outline" size="sm" onClick={handleCopy} disabled={copied}>
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy to Clipboard
                          </>
                        )}
                      </Button>
                    </div>

                    <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96 border">
                      <code>{JSON.stringify(previewData, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

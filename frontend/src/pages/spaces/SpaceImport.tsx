import { useState } from "react"
import { useNavigate } from "react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Upload, FileText } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { spacesApi, type Space } from "@/lib/api/spaces"
import { useSpacesStore } from "@/stores/spacesStore"
import { toast } from "sonner"

export default function SpaceImport() {
  const navigate = useNavigate()
  const { loadSpaces } = useSpacesStore()
  const [fileData, setFileData] = useState<{ space: Space; notes?: unknown[]; comments?: unknown[] } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const parseAndValidate = (text: string) => {
    try {
      const data = JSON.parse(text)
      if (data && typeof data === "object" && "space" in data) {
        setFileData(data as { space: Space; notes?: unknown[]; comments?: unknown[] })
        setJsonError(null)
        return true
      } else {
        setJsonError("Invalid format: missing space data")
        setFileData(null)
        return false
      }
    } catch (err) {
      setJsonError("Invalid JSON: " + (err instanceof Error ? err.message : "Unknown error"))
      setFileData(null)
      return false
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      if (!parseAndValidate(text)) {
        e.target.value = ""
        toast.error(jsonError || "Invalid file format")
      }
    } catch (err) {
      toast.error("Failed to read file: " + (err instanceof Error ? err.message : "Unknown error"))
      setFileData(null)
      e.target.value = ""
    }
  }

  const handleTextareaChange = (value: string) => {
    if (value.trim()) {
      parseAndValidate(value.trim())
    } else {
      setFileData(null)
      setJsonError(null)
    }
  }

  const handleImport = async () => {
    if (!fileData) return

    setIsImporting(true)

    try {
      const result = await spacesApi.importSpace(fileData)
      await loadSpaces()
      toast.success(`Space imported successfully! ${result.notes_imported} notes imported.`)
      navigate(`/notes/${result.space_id}`)
    } catch {
      // Error is handled by global error handler
      setIsImporting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Import Space" subtitle="Import a space from a JSON file or paste JSON data directly" />

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="paste">Paste JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a JSON file exported from SpaceNote containing space configuration and data.
                </p>

                <div>
                  <Label htmlFor="file-upload">Choose File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="cursor-pointer mt-1"
                    disabled={isImporting}
                  />
                </div>

                {fileData && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">Space Preview</h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>ID:</strong> {fileData.space.id}
                      </p>
                      <p>
                        <strong>Name:</strong> {fileData.space.name}
                      </p>
                      <p>
                        <strong>Fields:</strong> {fileData.space.fields.length}
                      </p>
                      <p>
                        <strong>Filters:</strong> {fileData.space.filters.length}
                      </p>
                      {fileData.notes && (
                        <p>
                          <strong>Notes:</strong> {fileData.notes.length}
                        </p>
                      )}
                      {fileData.comments && (
                        <p>
                          <strong>Comments:</strong> {fileData.comments.length}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button onClick={handleImport} disabled={!fileData || isImporting} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? "Importing..." : "Import Space"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="paste" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Paste JSON data exported from SpaceNote directly into the textarea below.
                </p>

                <div>
                  <Label htmlFor="json-input">JSON Data</Label>
                  <Textarea
                    id="json-input"
                    placeholder="Paste your space JSON data here..."
                    onChange={e => handleTextareaChange(e.target.value)}
                    className="mt-1 font-mono text-sm min-h-48"
                    disabled={isImporting}
                  />
                  {jsonError && <p className="text-sm text-red-600 mt-1">{jsonError}</p>}
                </div>

                {fileData && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">Space Preview</h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>ID:</strong> {fileData.space.id}
                      </p>
                      <p>
                        <strong>Name:</strong> {fileData.space.name}
                      </p>
                      <p>
                        <strong>Fields:</strong> {fileData.space.fields.length}
                      </p>
                      <p>
                        <strong>Filters:</strong> {fileData.space.filters.length}
                      </p>
                      {fileData.notes && (
                        <p>
                          <strong>Notes:</strong> {fileData.notes.length}
                        </p>
                      )}
                      {fileData.comments && (
                        <p>
                          <strong>Comments:</strong> {fileData.comments.length}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button onClick={handleImport} disabled={!fileData || isImporting} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  {isImporting ? "Importing..." : "Import Space"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from "react"
import { useNavigate } from "react-router"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { spacesApi, type Space } from "@/lib/api/spaces"
import { useSpacesStore } from "@/stores/spacesStore"
import type { BaseDialogProps } from "@/lib/dialog/types"
import { toast } from "sonner"

export default function ImportSpaceDialog({ onClose }: BaseDialogProps) {
  const navigate = useNavigate()
  const { loadSpaces } = useSpacesStore()
  const [fileData, setFileData] = useState<{ space: Space; notes?: unknown[]; comments?: unknown[] } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (data && typeof data === "object" && "space" in data) {
        setFileData(data as { space: Space; notes?: unknown[]; comments?: unknown[] })
      } else {
        toast.error("Invalid file format: missing space data")
        setFileData(null)
        e.target.value = "" // Reset file input
      }
    } catch (err) {
      toast.error("Failed to read file: " + (err instanceof Error ? err.message : "Unknown error"))
      setFileData(null)
      e.target.value = "" // Reset file input
    }
  }

  const handleImport = async () => {
    if (!fileData) return

    setIsImporting(true)

    try {
      const result = await spacesApi.importSpace(fileData)
      await loadSpaces()
      toast.success(`Space imported successfully! ${result.notes_imported} notes imported.`)
      onClose()
      navigate(`/notes/${result.space_id}`)
    } catch {
      // Error is handled by global error handler
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => !isImporting && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Space</DialogTitle>
          <DialogDescription>Import a space from a JSON file exported from SpaceNote</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input type="file" accept=".json" onChange={handleFileChange} className="cursor-pointer" disabled={isImporting} />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!fileData || isImporting}>
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

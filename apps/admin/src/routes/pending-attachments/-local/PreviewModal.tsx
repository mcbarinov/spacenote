import { useEffect, useState } from "react"
import { Modal, Code, ScrollArea, Image, Center, Loader, Text, Stack } from "@mantine/core"
import type { PendingAttachment } from "@spacenote/common/types"
import { getPreviewType, getPreviewUrl } from "./preview-utils"

interface PreviewModalProps {
  attachment: PendingAttachment | null
  onClose: () => void
}

/** Modal for previewing attachment content (images and text files) */
export function PreviewModal({ attachment, onClose }: PreviewModalProps) {
  const previewType = attachment ? getPreviewType(attachment.mime_type) : null

  return (
    <Modal
      opened={attachment !== null}
      onClose={onClose}
      title={
        attachment ? (
          <Stack gap={0}>
            <Text fw={500}>{attachment.filename}</Text>
            <Text size="xs" c="dimmed">
              {attachment.mime_type}
            </Text>
          </Stack>
        ) : null
      }
      size={previewType === "image" ? "xl" : "lg"}
    >
      {attachment && previewType === "image" && <ImagePreview key={attachment.number} attachment={attachment} />}
      {attachment && previewType === "text" && <TextPreview key={attachment.number} attachment={attachment} />}
    </Modal>
  )
}

/** Image preview with loading state */
function ImagePreview({ attachment }: { attachment: PendingAttachment }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const url = getPreviewUrl(attachment.number, attachment.mime_type)

  return (
    <Stack>
      {loading && !error && (
        <Center py="xl">
          <Loader />
        </Center>
      )}
      {error && (
        <Center py="xl">
          <Text c="red">Failed to load image</Text>
        </Center>
      )}
      <Image
        src={url}
        alt={attachment.filename}
        fit="contain"
        mah="70vh"
        onLoad={() => {
          setLoading(false)
        }}
        onError={() => {
          setLoading(false)
          setError(true)
        }}
        style={{ display: loading || error ? "none" : "block" }}
      />
    </Stack>
  )
}

type TextPreviewState = { status: "loading" } | { status: "error"; message: string } | { status: "success"; content: string }

/** Text preview with fetch and code display */
function TextPreview({ attachment }: { attachment: PendingAttachment }) {
  const [state, setState] = useState<TextPreviewState>({ status: "loading" })
  const url = getPreviewUrl(attachment.number, attachment.mime_type)

  useEffect(() => {
    let cancelled = false

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        if (!cancelled) setState({ status: "success", content: text })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ status: "error", message: err instanceof Error ? err.message : "Failed to load" })
        }
      })

    return () => {
      cancelled = true
    }
  }, [url])

  if (state.status === "loading") {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  if (state.status === "error") {
    return (
      <Center py="xl">
        <Text c="red">{state.message}</Text>
      </Center>
    )
  }

  return (
    <ScrollArea.Autosize mah="70vh">
      <Code block style={{ whiteSpace: "pre-wrap" }}>
        {state.content}
      </Code>
    </ScrollArea.Autosize>
  )
}

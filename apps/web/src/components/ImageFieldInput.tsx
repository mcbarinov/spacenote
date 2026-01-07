import { FileInput, Image, Stack, Group, ActionIcon, Box, Loader, Text } from "@mantine/core"
import { IconUpload, IconX } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"
import type { AttachmentMeta } from "@spacenote/common/types"

export interface ImageFieldInputProps {
  label: string
  required: boolean
  error?: string
  /** Pending attachment number or null if no image selected */
  value: number | null
  /** Called with pending attachment number after upload, or null on removal */
  onChange: (value: number | null) => void
  /** Called with attachment metadata after upload (for EXIF data extraction) */
  onMetadata?: (meta: AttachmentMeta | null) => void
}

/** Image upload input with preview, loading, and error states */
export function ImageFieldInput({ label, required, error, value, onChange, onMetadata }: ImageFieldInputProps) {
  const uploadMutation = api.mutations.useUploadPendingAttachment()
  const deleteMutation = api.mutations.useDeletePendingAttachment()

  /** Uploads file as pending attachment and updates value with attachment number */
  const handleFileChange = (file: File | null) => {
    if (!file) return
    uploadMutation.mutate(file, {
      onSuccess: (pending) => {
        onChange(pending.number)
        onMetadata?.(pending.meta)
      },
    })
  }

  /** Clears the selected image and deletes pending attachment from server */
  const handleRemove = () => {
    if (value !== null) {
      deleteMutation.mutate(value)
    }
    onChange(null)
    onMetadata?.(null)
  }

  if (uploadMutation.isPending) {
    return (
      <Box>
        <Text size="sm" fw={500} mb={4}>
          {label}
          {required && " *"}
        </Text>
        <Group gap="xs">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Uploading...
          </Text>
        </Group>
      </Box>
    )
  }

  if (uploadMutation.error) {
    return (
      <Box>
        <Text size="sm" fw={500} mb={4}>
          {label}
          {required && " *"}
        </Text>
        <Stack gap="xs">
          <Text size="sm" c="red">
            Upload failed: {uploadMutation.error.message}
          </Text>
          <FileInput
            accept="image/*"
            placeholder="Try again"
            leftSection={<IconUpload size={16} />}
            onChange={handleFileChange}
          />
        </Stack>
      </Box>
    )
  }

  if (value !== null) {
    const previewUrl = `/api/v1/attachments/pending/${value}?format=webp&option=max_width:400`
    return (
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          {label}
          {required && " *"}
        </Text>
        <Box pos="relative" style={{ width: "fit-content" }}>
          <Image src={previewUrl} alt={label} maw={400} radius="sm" />
          <ActionIcon variant="filled" color="red" size="sm" pos="absolute" top={8} right={8} onClick={handleRemove}>
            <IconX size={14} />
          </ActionIcon>
        </Box>
        {error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}
      </Stack>
    )
  }

  return (
    <FileInput
      label={label}
      required={required}
      error={error}
      accept="image/*"
      placeholder="Select image"
      leftSection={<IconUpload size={16} />}
      onChange={handleFileChange}
    />
  )
}

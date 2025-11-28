import { FileInput, Image, Stack, Group, ActionIcon, Box, Loader, Text } from "@mantine/core"
import { IconUpload, IconX } from "@tabler/icons-react"
import { api } from "@spacenote/common/api"

export interface ImageFieldInputProps {
  label: string
  required: boolean
  error?: string
  value: number | null
  onChange: (value: number | null) => void
}

export function ImageFieldInput({ label, required, error, value, onChange }: ImageFieldInputProps) {
  const uploadMutation = api.mutations.useUploadPendingAttachment()

  const handleFileChange = (file: File | null) => {
    if (!file) return
    uploadMutation.mutate(file, {
      onSuccess: (pending) => {
        onChange(pending.number)
      },
    })
  }

  const handleRemove = () => {
    onChange(null)
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
    const previewUrl = `/api/v1/attachments/pending/${String(value)}?format=webp&option=max_width:400`
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

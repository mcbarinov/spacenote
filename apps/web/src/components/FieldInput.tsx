import {
  TextInput,
  Checkbox,
  Select,
  NumberInput,
  TagsInput,
  FileInput,
  Image,
  Stack,
  Group,
  ActionIcon,
  Box,
  Loader,
  Text,
} from "@mantine/core"
import { IconUpload, IconX } from "@tabler/icons-react"
import { DateTimePicker } from "@mantine/dates"
import { api } from "@spacenote/common/api"
import type { SpaceField } from "@spacenote/common/types"
import { MarkdownEditor } from "./MarkdownEditor"

interface FieldInputProps {
  field: SpaceField
  value?: unknown
  onChange: (value: unknown) => void
  error?: string
  spaceMembers?: string[]
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function asBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false
}

function asNumber(value: unknown): number | string {
  return typeof value === "number" ? value : ""
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string")
  }
  return []
}

interface ImageFieldInputProps {
  label: string
  required: boolean
  error?: string
  value: number | null
  onChange: (value: number | null) => void
}

function ImageFieldInput({ label, required, error, value, onChange }: ImageFieldInputProps) {
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

export function FieldInput({ field, value, onChange, error, spaceMembers }: FieldInputProps) {
  const commonProps = {
    label: field.name,
    required: field.required,
    error,
  }

  switch (field.type) {
    case "string":
      return (
        <TextInput
          {...commonProps}
          value={asString(value)}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
        />
      )

    case "markdown":
      return (
        <MarkdownEditor
          {...commonProps}
          value={asString(value)}
          onChange={(v) => {
            onChange(v)
          }}
        />
      )

    case "boolean":
      return (
        <Checkbox
          label={field.name}
          required={field.required}
          error={error}
          checked={asBoolean(value)}
          onChange={(e) => {
            onChange(e.currentTarget.checked)
          }}
        />
      )

    case "select": {
      const options = (field.options?.values as string[] | undefined) ?? []
      return (
        <Select
          {...commonProps}
          data={options}
          value={asString(value) || null}
          onChange={(v) => {
            onChange(v)
          }}
          clearable={!field.required}
        />
      )
    }

    case "tags":
      return (
        <TagsInput
          {...commonProps}
          value={asStringArray(value)}
          onChange={(v) => {
            onChange(v)
          }}
        />
      )

    case "int":
    case "float":
      return (
        <NumberInput
          {...commonProps}
          value={asNumber(value)}
          onChange={(v) => {
            onChange(v)
          }}
          min={field.options?.min as number | undefined}
          max={field.options?.max as number | undefined}
          allowDecimal={field.type === "float"}
        />
      )

    case "datetime":
      return (
        <DateTimePicker
          {...commonProps}
          value={value instanceof Date ? value : value ? new Date(asString(value)) : null}
          onChange={(date) => {
            onChange(date)
          }}
          clearable={!field.required}
        />
      )

    case "user":
      return (
        <Select
          {...commonProps}
          data={spaceMembers ?? []}
          value={asString(value) || null}
          onChange={(v) => {
            onChange(v)
          }}
          clearable={!field.required}
          searchable
        />
      )

    case "image": {
      const pendingNumber = typeof value === "number" ? value : null
      return (
        <ImageFieldInput label={field.name} required={field.required} error={error} value={pendingNumber} onChange={onChange} />
      )
    }

    default:
      return (
        <TextInput
          {...commonProps}
          value={asString(value)}
          onChange={(e) => {
            onChange(e.currentTarget.value)
          }}
        />
      )
  }
}

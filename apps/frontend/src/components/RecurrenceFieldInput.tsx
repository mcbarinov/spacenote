import { ActionIcon, Group, NumberInput, Select, Stack, Text, Tooltip } from "@mantine/core"
import { modals } from "@mantine/modals"
import { IconCheck, IconRestore } from "@tabler/icons-react"
import { TextBadge } from "@/components/TextBadge"
import { api } from "@/api"
import type { RecurrenceValue } from "@/types"
import { INTERVAL_UNITS, RECURRENCE_STATUS_CONFIG, buildInterval, getRecurrenceStatus, parseInterval } from "@/utils/recurrence"
import { formatDatetime } from "@/utils/format"

interface RecurrenceNoteContext {
  slug: string
  noteNumber: number
  fieldName: string
  currentValue: RecurrenceValue
}

interface RecurrenceFieldInputProps {
  label: string
  required: boolean
  error?: string
  value: string
  onChange: (value: string) => void
  noteContext?: RecurrenceNoteContext
}

/** Interval input with number + unit selector, plus Done/Reset actions for existing notes */
export function RecurrenceFieldInput({ label, required, error, value, onChange, noteContext }: RecurrenceFieldInputProps) {
  const parsed = parseInterval(value)
  const count = parsed?.count ?? ""
  const unit = parsed?.unit ?? "w"

  function handleCountChange(newCount: number | string) {
    if (typeof newCount === "number" && newCount >= 1) {
      onChange(buildInterval(newCount, unit))
    } else {
      onChange("")
    }
  }

  function handleUnitChange(newUnit: string | null) {
    if (newUnit && typeof count === "number" && count >= 1) {
      onChange(buildInterval(count, newUnit))
    }
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" align="flex-start">
        <NumberInput
          label={label}
          required={required}
          error={error}
          value={count}
          onChange={handleCountChange}
          min={1}
          allowDecimal={false}
          w={120}
        />
        <Select label="Unit" data={[...INTERVAL_UNITS]} value={unit} onChange={handleUnitChange} w={120} mt={0} />
      </Group>
      {noteContext && <RecurrenceActions noteContext={noteContext} />}
    </Stack>
  )
}

/** Displays current recurrence status and Done/Reset action buttons */
function RecurrenceActions({ noteContext }: { noteContext: RecurrenceNoteContext }) {
  const { slug, noteNumber, fieldName, currentValue } = noteContext
  const status = getRecurrenceStatus(currentValue)
  const config = RECURRENCE_STATUS_CONFIG[status]
  const updateMutation = api.mutations.useUpdateNote(slug, noteNumber)

  function handleDone() {
    updateMutation.mutate({ raw_fields: { [fieldName]: "$done" } })
  }

  function handleReset() {
    modals.openConfirmModal({
      title: "Reset recurrence",
      children: <Text size="sm">Reset completion status? The timer will restart from now.</Text>,
      labels: { confirm: "Reset", cancel: "Cancel" },
      confirmProps: { color: "gray" },
      onConfirm: () => {
        updateMutation.mutate({ raw_fields: { [fieldName]: "$reset" } })
      },
    })
  }

  return (
    <Group gap="sm">
      <TextBadge color={config.color}>{config.label}</TextBadge>
      <Text size="sm" c="dimmed">
        Due: {formatDatetime(currentValue.next_due, "utc")}
      </Text>
      {currentValue.last_completed && (
        <Text size="sm" c="dimmed">
          Last: {formatDatetime(currentValue.last_completed, "utc")}
        </Text>
      )}
      <Tooltip label="Mark done">
        <ActionIcon variant="light" color="green" size="sm" onClick={handleDone} loading={updateMutation.isPending}>
          <IconCheck size={14} />
        </ActionIcon>
      </Tooltip>
      {currentValue.last_completed && (
        <Tooltip label="Reset">
          <ActionIcon variant="light" color="gray" size="sm" onClick={handleReset} loading={updateMutation.isPending}>
            <IconRestore size={14} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  )
}

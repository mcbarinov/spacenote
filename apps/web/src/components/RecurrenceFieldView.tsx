import { Group, Text } from "@mantine/core"
import { TextBadge } from "@spacenote/common/components"
import type { RecurrenceValue } from "@spacenote/common/types"
import { formatDatetime, formatInterval, getRecurrenceStatus, RECURRENCE_STATUS_CONFIG } from "@spacenote/common/utils"

interface RecurrenceFieldViewProps {
  value: RecurrenceValue
}

/** Displays recurrence status, interval, and dates (read-only) */
export function RecurrenceFieldView({ value }: RecurrenceFieldViewProps) {
  const status = getRecurrenceStatus(value)
  const config = RECURRENCE_STATUS_CONFIG[status]

  return (
    <Group gap="sm">
      <TextBadge color={config.color}>{config.label}</TextBadge>
      <Text size="sm">{formatInterval(value.interval)}</Text>
      <Text size="sm" c="dimmed">
        Due: {formatDatetime(value.next_due, "utc")}
      </Text>
      {value.last_completed && (
        <Text size="sm" c="dimmed">
          Last: {formatDatetime(value.last_completed, "utc")}
        </Text>
      )}
    </Group>
  )
}

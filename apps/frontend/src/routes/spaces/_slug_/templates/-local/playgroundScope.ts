import React from "react"
import { Stack, Group, Title, Text, Badge, Paper, Divider, Card, Image } from "@mantine/core"
import { CustomLink } from "@/components/CustomLink"
import { formatInterval, getRecurrenceStatus, RECURRENCE_STATUS_CONFIG } from "@/utils/recurrence"
import type { RecurrenceValue, SelectFieldOptions, Space } from "@/types"

/** recurrence(value) — returns { statusColor, statusLabel, interval, due, lastCompleted } or null */
function recurrence(value: RecurrenceValue | null | undefined) {
  if (!value) return null
  const status = getRecurrenceStatus(value)
  const config = RECURRENCE_STATUS_CONFIG[status]
  return {
    statusColor: config.color,
    statusLabel: config.label,
    interval: formatInterval(value.interval),
    due: new Date(value.next_due).toLocaleDateString(),
    lastCompleted: value.last_completed ? new Date(value.last_completed).toLocaleDateString() : null,
  }
}

/** tags(arr) — ["a","b"] → "#a #b" */
function tags(value: string[] | null | undefined): string {
  if (!value || value.length === 0) return ""
  return value.map((t) => `#${t}`).join(" ")
}

/** user(username) — "admin" → "👤admin" */
function user(username: string): string {
  return `👤${username}`
}

/** color(space, fieldName, value) — lookup color from field's value_maps */
function color(space: Space, fieldName: string, value: string): string | undefined {
  const field = space.fields.find((f) => f.name === fieldName)
  if (field?.type !== "select") return undefined
  const opts = field.options as SelectFieldOptions
  return opts.value_maps?.color[value]
}

/** Mantine components available in playground scope */
export const mantineScope = {
  React,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Paper,
  Divider,
  Card,
  Image,
  CustomLink,
  recurrence,
  tags,
  user,
  color,
}

import { useEffect, useRef } from "react"
import { ActionIcon, Box, Button, Card, Group, Select, Stack, TagsInput, Text, TextInput } from "@mantine/core"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import type { UseFormReturnType } from "@mantine/form"
import type { FormValues } from "./fieldFormUtils"

interface Props {
  form: UseFormReturnType<FormValues>
}

/** Options (values, value_maps) and default for select field type */
export function SelectFieldConfig({ form }: Props) {
  const { selectValues, valueMaps } = form.values
  const prevSelectValuesRef = useRef<string[]>(selectValues)

  // Sync valueMaps keys when selectValues change
  useEffect(() => {
    const prevValues = prevSelectValuesRef.current
    const currentValues = selectValues

    // Skip if no changes
    if (prevValues.length === currentValues.length && prevValues.every((val, idx) => val === currentValues[idx])) {
      return
    }

    // Read current valueMaps from form
    const currentValueMaps = form.values.valueMaps

    // Skip if no maps to sync
    if (currentValueMaps.length === 0) {
      prevSelectValuesRef.current = currentValues
      return
    }

    const addedValues = currentValues.filter((v) => !prevValues.includes(v))
    const removedValues = prevValues.filter((v) => !currentValues.includes(v))

    if (addedValues.length === 0 && removedValues.length === 0) {
      prevSelectValuesRef.current = currentValues
      return
    }

    // Update each map's values
    const updatedMaps = currentValueMaps.map((map) => {
      // Start with existing values, excluding removed ones
      const newValues: Record<string, string> = {}
      for (const [key, value] of Object.entries(map.values)) {
        if (!removedValues.includes(key)) {
          newValues[key] = value
        }
      }

      // Add keys for new values
      for (const val of addedValues) {
        if (!(val in newValues)) {
          newValues[val] = ""
        }
      }

      return { ...map, values: newValues }
    })

    form.setFieldValue("valueMaps", updatedMaps)
    prevSelectValuesRef.current = currentValues
  }, [selectValues, form])

  /** Adds a new empty value map */
  function handleAddMap() {
    const initialValues: Record<string, string> = {}
    for (const val of selectValues) {
      initialValues[val] = ""
    }
    const id = crypto.randomUUID()
    form.setFieldValue("valueMaps", [...valueMaps, { id, name: "", values: initialValues }])
  }

  /** Removes a value map by index */
  function handleRemoveMap(index: number) {
    form.setFieldValue(
      "valueMaps",
      valueMaps.filter((_, i) => i !== index)
    )
  }

  /** Updates a map's name */
  function handleMapNameChange(index: number, name: string) {
    const updated = [...valueMaps]
    updated[index] = { ...updated[index], name }
    form.setFieldValue("valueMaps", updated)
  }

  /** Updates a value in a map */
  function handleMapValueChange(mapIndex: number, key: string, value: string) {
    const updated = [...valueMaps]
    updated[mapIndex] = {
      ...updated[mapIndex],
      values: { ...updated[mapIndex].values, [key]: value },
    }
    form.setFieldValue("valueMaps", updated)
  }

  return (
    <>
      <TagsInput label="Values" placeholder="Enter values and press Enter" {...form.getInputProps("selectValues")} />

      {/* Value Maps section */}
      {selectValues.length > 0 && (
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Value Maps
          </Text>
          <Stack gap="sm">
            {valueMaps.map((map, mapIndex) => (
              <Card key={map.id} withBorder padding="sm">
                <Stack gap="xs">
                  <Group>
                    <TextInput
                      placeholder="Map name (e.g. emoji, label)"
                      value={map.name}
                      onChange={(e) => {
                        handleMapNameChange(mapIndex, e.currentTarget.value)
                      }}
                      style={{ flex: 1 }}
                    />
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        handleRemoveMap(mapIndex)
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>

                  {selectValues.map((val) => (
                    <Group key={val} gap="xs">
                      <Text size="sm" c="dimmed" w={100} style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {val}
                      </Text>
                      <TextInput
                        placeholder={`Value for "${val}"`}
                        value={map.values[val] ?? ""}
                        onChange={(e) => {
                          handleMapValueChange(mapIndex, val, e.currentTarget.value)
                        }}
                        style={{ flex: 1 }}
                      />
                    </Group>
                  ))}
                </Stack>
              </Card>
            ))}

            <Button variant="subtle" leftSection={<IconPlus size={16} />} onClick={handleAddMap}>
              Add Map
            </Button>
          </Stack>
        </Box>
      )}

      <Select
        label="Default"
        placeholder={selectValues.length === 0 ? "Define values first" : "No default"}
        data={selectValues}
        disabled={selectValues.length === 0}
        {...form.getInputProps("defaultSelect")}
        clearable
      />
    </>
  )
}

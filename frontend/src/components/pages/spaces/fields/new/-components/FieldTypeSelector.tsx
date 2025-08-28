import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { FieldType } from "@/types"
import { FIELD_TYPES } from "./fieldTypeConfigs"

interface FieldTypeSelectorProps {
  value: FieldType
  onChange: (value: FieldType) => void
  disabled?: boolean
}

export function FieldTypeSelector({ value, onChange, disabled }: FieldTypeSelectorProps) {
  return (
    <FormItem>
      <FormLabel>Field Type</FormLabel>
      <Select onValueChange={onChange} value={value} disabled={disabled}>
        <FormControl>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {FIELD_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )
}

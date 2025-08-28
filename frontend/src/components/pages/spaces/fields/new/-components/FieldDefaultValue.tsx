import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormControl, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import type { FieldType } from "@/types"
import { parseCommaSeparatedValues } from "./fieldTypeConfigs"
import type { UseFormReturn } from "react-hook-form"

interface FieldDefaultValueProps {
  fieldType: FieldType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  disabled?: boolean
}

export function FieldDefaultValue({ fieldType, form, disabled }: FieldDefaultValueProps) {
  const renderDefaultInput = () => {
    switch (fieldType) {
      case "boolean":
        return (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={form.watch("defaultValue") === true}
                onCheckedChange={(checked) => {
                  form.setValue("defaultValue", checked)
                }}
                disabled={disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Default to checked</FormLabel>
              <FormDescription>This field will be checked by default in new notes</FormDescription>
            </div>
          </FormItem>
        )

      case "string_choice": {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const values = form.watch("values")
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const valuesList = values ? parseCommaSeparatedValues(values) : []

        return (
          <FormItem>
            <FormLabel>Default Value</FormLabel>
            <Select
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              value={form.watch("defaultValue") ?? ""}
              onValueChange={(value) => {
                form.setValue("defaultValue", value)
              }}
              disabled={disabled ?? valuesList.length === 0}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={valuesList.length === 0 ? "Define values first" : "Select default"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {valuesList.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>Default selection for new notes</FormDescription>
            <FormMessage />
          </FormItem>
        )
      }

      case "tags":
        return (
          <FormItem>
            <FormLabel>Default Tags</FormLabel>
            <FormControl>
              <Input
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                value={form.watch("defaultValue") ?? ""}
                onChange={(e) => {
                  form.setValue("defaultValue", e.target.value)
                }}
                placeholder="tag1, tag2, tag3"
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>Default tags for new notes (comma separated)</FormDescription>
            <FormMessage />
          </FormItem>
        )

      case "datetime":
        return (
          <FormItem>
            <FormLabel>Default Value</FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                value={form.watch("defaultValue") ?? ""}
                onChange={(e) => {
                  form.setValue("defaultValue", e.target.value)
                }}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>Default date/time for new notes</FormDescription>
            <FormMessage />
          </FormItem>
        )

      case "int":
      case "float":
        return (
          <FormItem>
            <FormLabel>Default Value</FormLabel>
            <FormControl>
              <Input
                type="number"
                step={fieldType === "float" ? "any" : "1"}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                value={form.watch("defaultValue") ?? ""}
                onChange={(e) => {
                  const value = e.target.value
                  form.setValue("defaultValue", value === "" ? undefined : Number(value))
                }}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>Default numeric value for new notes</FormDescription>
            <FormMessage />
          </FormItem>
        )

      case "string":
      case "markdown":
      case "user":
      default:
        return (
          <FormItem>
            <FormLabel>Default Value</FormLabel>
            <FormControl>
              <Input
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                value={form.watch("defaultValue") ?? ""}
                onChange={(e) => {
                  form.setValue("defaultValue", e.target.value)
                }}
                placeholder={fieldType === "user" ? "Username" : "Default value"}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>Default value for new notes</FormDescription>
            <FormMessage />
          </FormItem>
        )
    }
  }

  return (
    <>
      <div className="space-y-2">
        {/* <h3 className="text-sm font-medium">Default Value (Optional)</h3> */}
        {renderDefaultInput()}
      </div>
    </>
  )
}

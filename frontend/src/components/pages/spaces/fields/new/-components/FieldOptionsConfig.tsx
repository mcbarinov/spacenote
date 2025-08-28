import { Input } from "@/components/ui/input"
import { FormControl, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import type { FieldType } from "@/types"
import type { UseFormReturn } from "react-hook-form"

interface FieldOptionsConfigProps {
  fieldType: FieldType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  disabled?: boolean
}

export function FieldOptionsConfig({ fieldType, form, disabled }: FieldOptionsConfigProps) {
  const hasValues = fieldType === "string_choice" || fieldType === "tags"
  const hasMinMax = fieldType === "int" || fieldType === "float"

  if (!hasValues && !hasMinMax) {
    return null
  }

  return (
    <>
      {hasValues && (
        <FormItem>
          <FormLabel>Values {fieldType === "tags" ? "(available tags)" : "(options)"}</FormLabel>
          <FormControl>
            <Input {...form.register("values")} placeholder="option1, option2, option3" disabled={disabled} />
          </FormControl>
          <FormDescription>Comma-separated list of {fieldType === "tags" ? "available tags" : "options"}</FormDescription>
          <FormMessage />
        </FormItem>
      )}

      {hasMinMax && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Min Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step={fieldType === "float" ? "any" : "1"}
                  {...form.register("min", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>Optional minimum value</FormDescription>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Max Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step={fieldType === "float" ? "any" : "1"}
                  {...form.register("max", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>Optional maximum value</FormDescription>
              <FormMessage />
            </FormItem>
          </div>
        </>
      )}
    </>
  )
}

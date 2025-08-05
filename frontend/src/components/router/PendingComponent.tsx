import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

export function PendingComponent() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <LoadingSpinner />
    </div>
  )
}
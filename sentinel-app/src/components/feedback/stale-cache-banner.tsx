import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useRulesStore } from "@/stores/rules.store"

export function StaleCacheBanner() {
  const isStale = useRulesStore((s) => s.isStale())

  if (!isStale) return null

  return (
    <Alert className="rounded-none border-x-0 border-t-0 border-warning bg-warning/10">
      <AlertTriangle data-icon="inline-start" className="text-warning" />
      <AlertDescription>
        Rules cache is over 1 hour old. Risk classifications may not reflect the
        latest rules. Connect to the network to update.
      </AlertDescription>
    </Alert>
  )
}

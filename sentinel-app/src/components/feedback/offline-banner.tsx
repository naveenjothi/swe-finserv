import { Alert, AlertDescription } from "@/components/ui/alert"
import { WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/shared/hooks/use-online-status"

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
      <WifiOff data-icon="inline-start" />
      <AlertDescription>
        You are offline. Records will be saved locally and synced when
        connectivity is restored.
      </AlertDescription>
    </Alert>
  )
}

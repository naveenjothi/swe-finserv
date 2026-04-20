import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/stores/auth.store"
import { useOnlineStatus } from "@/shared/hooks/use-online-status"
import { useOfflineStore } from "@/stores/offline.store"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, CloudUpload } from "lucide-react"
import { ROLE_LABELS } from "@/shared/constants/roles"

export function TopBar() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isOnline = useOnlineStatus()
  const pendingCount = useOfflineStore((s) => s.pendingRecords.length)

  return (
    <header className="flex h-14 items-center gap-4 border-b px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-sm font-medium">SENTINEL</h1>
      </div>

      <div className="flex items-center gap-3">
        {pendingCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <CloudUpload className="size-3" />
            {pendingCount} pending
          </Badge>
        )}

        {isOnline ? (
          <Wifi className="size-4 text-success" />
        ) : (
          <WifiOff className="size-4 text-destructive" />
        )}

        {user && role && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{ROLE_LABELS[role]}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="font-medium">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  )
}

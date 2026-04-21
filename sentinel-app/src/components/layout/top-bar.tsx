import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/stores/auth.store"
import { useOnlineStatus } from "@/shared/hooks/use-online-status"
import { useOfflineStore } from "@/stores/offline.store"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Wifi, WifiOff, CloudUpload } from "lucide-react"
import { ROLE_LABELS, ROLES } from "@/shared/constants/roles"
import type { Role } from "@/shared/types/auth.types"

export function TopBar() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const switchRole = useAuthStore((s) => s.switchRole)
  const isOnline = useOnlineStatus()
  const pendingCount = useOfflineStore((s) => s.pendingRecords.length)

  const roleOptions: Role[] = [
    ROLES.RM,
    ROLES.COMPLIANCE_OFFICER,
    ROLES.AUDITOR,
  ]

  return (
    <header className="flex h-14 items-center gap-4 border-b border-primary-light/60 bg-primary px-6 text-primary-foreground">
      <SidebarTrigger />
      <Separator
        orientation="vertical"
        className="h-6 bg-primary-foreground/30"
      />

      <div className="flex flex-1 items-center gap-4">
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">
            Halcyon Capital Partners
          </span>
          <span className="text-[13px] font-normal text-primary-foreground/80">
            SENTINEL Onboarding
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {pendingCount > 0 && (
          <Badge
            variant="secondary"
            className="gap-1 bg-primary-light text-primary-foreground"
          >
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
            <Select
              value={role}
              onValueChange={(value) => {
                const nextRole = value as Role
                if (nextRole === role) return
                switchRole(nextRole)
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Switch role"
                className="border-primary-light/60 bg-primary-light/35 text-primary-foreground"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roleOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ROLE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Separator
              orientation="vertical"
              className="h-4 bg-primary-foreground/30"
            />
            <span className="font-medium">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  )
}

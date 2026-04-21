import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOfflineStore } from "@/stores/offline.store"
import { useOnlineStatus } from "@/shared/hooks/use-online-status"
import { Users, AlertTriangle, CloudUpload, BarChart3 } from "lucide-react"

export function Component() {
  const pendingCount = useOfflineStore((s) => s.pendingRecords.length)
  const isOnline = useOnlineStatus()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of client onboarding and risk classification
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <CardDescription>Across all branches</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Risk Distribution
            </CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-risk-high text-white">HIGH</Badge>
              <Badge className="bg-risk-medium text-white">MED</Badge>
              <Badge className="bg-risk-low text-white">LOW</Badge>
            </div>
            <CardDescription className="mt-1">
              Connect to load data
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Sync</CardTitle>
            <CloudUpload className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <CardDescription>
              {isOnline ? "Online — ready to sync" : "Offline — queued locally"}
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Findings</CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <CardDescription>Requiring attention</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

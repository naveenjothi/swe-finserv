import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Lock,
  BarChart3,
} from "lucide-react"
import { typedApi } from "@/shared/api/generated/typed-client"
import type { components } from "@/shared/api/generated/sentinel-api.types"

type AuditEntryView = components["schemas"]["AuditEntryView"]
type PaginatedAuditEntryView = components["schemas"]["PaginatedAuditEntryView"]
type PaginatedClientView = components["schemas"]["PaginatedClientView"]
type PaginatedKycCaseView = components["schemas"]["PaginatedKycCaseView"]

const EVENT_TYPE_COLORS: Record<string, string> = {
  ONBOARDING_CREATED: "bg-blue-100 text-blue-800",
  ONBOARDING_UPDATED: "bg-blue-100 text-blue-800",
  KYC_STATUS_CHANGED: "bg-amber-100 text-amber-800",
  RISK_RECLASSIFIED: "bg-red-100 text-red-800",
  RULES_VERSION_UPDATED: "bg-purple-100 text-purple-800",
  CORRECTION_SUBMITTED: "bg-green-100 text-green-800",
}

export default function Component() {
  const [activeTab, setActiveTab] = useState<string>("audit-log")

  // Fetch audit log
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: async () => {
      const response = await typedApi.GET("/api/audit", {
        params: { query: { page: 1, pageSize: 100 } },
      })
      return response.data as PaginatedAuditEntryView
    },
  })

  // Fetch clients for data quality metrics
  const { data: clientsData } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await typedApi.GET("/api/clients", {
        params: { query: { page: 1, pageSize: 100 } },
      })
      return response.data as PaginatedClientView
    },
  })

  // Fetch KYC queue for compliance metrics
  const { data: kycData } = useQuery({
    queryKey: ["kyc-cases"],
    queryFn: async () => {
      const response = await typedApi.GET("/api/kyc", {
        params: { query: { page: 1, pageSize: 100 } },
      })
      return response.data as PaginatedKycCaseView
    },
  })

  // Calculate audit metrics
  const auditMetrics = {
    totalEvents: auditData?.items?.length || 0,
    onboardingEvents:
      auditData?.items?.filter((e) => e.event_type === "ONBOARDING_CREATED")
        .length || 0,
    kycChanges:
      auditData?.items?.filter((e) => e.event_type === "KYC_STATUS_CHANGED")
        .length || 0,
    riskChanges:
      auditData?.items?.filter((e) => e.event_type === "RISK_RECLASSIFIED")
        .length || 0,
    corrections:
      auditData?.items?.filter((e) => e.event_type === "CORRECTION_SUBMITTED")
        .length || 0,
  }

  // Calculate data quality metrics
  const dataQualityMetrics = {
    totalClients: clientsData?.items?.length || 0,
    mismatches: clientsData?.items?.filter((c) => c.mismatch).length || 0,
    missingDocs: clientsData?.items?.filter((c) => c.requires_edd).length || 0,
    highRisk:
      clientsData?.items?.filter((c) => c.computed_tier === "HIGH").length || 0,
    eddCases: kycData?.items?.filter((k) => k.requires_edd).length || 0,
  }

  // Get unique actors
  const uniqueActors = Array.from(
    new Set(auditData?.items?.map((e) => e.performed_by) || [])
  )

  const getEventColor = (eventType: string) => {
    return EVENT_TYPE_COLORS[eventType] || "bg-gray-100 text-gray-800"
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "ONBOARDING_CREATED":
        return "📋"
      case "KYC_STATUS_CHANGED":
        return "✓"
      case "RISK_RECLASSIFIED":
        return "⚠️"
      case "CORRECTION_SUBMITTED":
        return "🔄"
      case "RULES_VERSION_UPDATED":
        return "⚙️"
      default:
        return "📊"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Audit Dashboard</h1>
        <p className="text-muted-foreground">
          System-wide compliance audit trail and data quality metrics
        </p>
      </div>

      {/* Audit Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditMetrics.totalEvents}</div>
            <CardDescription>Audit log entries</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Onboardings</CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditMetrics.onboardingEvents}
            </div>
            <CardDescription>Created</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">KYC Changes</CardTitle>
            <TrendingUp className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditMetrics.kycChanges}</div>
            <CardDescription>Status updates</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Risk Changes</CardTitle>
            <AlertTriangle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditMetrics.riskChanges}</div>
            <CardDescription>Reclassifications</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Corrections</CardTitle>
            <Lock className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditMetrics.corrections}</div>
            <CardDescription>Audit entries</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Data Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Data Quality & Compliance Status
          </CardTitle>
          <CardDescription>
            Key metrics for compliance oversight
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="flex flex-col gap-2 rounded-lg bg-muted p-4">
              <span className="text-sm font-medium">Total Clients</span>
              <div className="text-2xl font-bold">
                {dataQualityMetrics.totalClients}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-4">
              <span className="text-sm font-medium">Mismatches</span>
              <div className="text-2xl font-bold text-red-600">
                {dataQualityMetrics.mismatches}
              </div>
              <p className="text-xs text-red-600">Data quality issues</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-amber-50 p-4">
              <span className="text-sm font-medium">Requires EDD</span>
              <div className="text-2xl font-bold text-amber-600">
                {dataQualityMetrics.missingDocs}
              </div>
              <p className="text-xs text-amber-600">Clients needing review</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-4">
              <span className="text-sm font-medium">HIGH Risk</span>
              <div className="text-2xl font-bold text-red-600">
                {dataQualityMetrics.highRisk}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-amber-50 p-4">
              <span className="text-sm font-medium">EDD Cases</span>
              <div className="text-2xl font-bold text-amber-600">
                {dataQualityMetrics.eddCases}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Tabs: Audit Log, Data Quality, Activity by User */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="audit-log" className="flex items-center gap-2">
            <Activity className="size-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="data-quality" className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Data Quality
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Audit Log Tab */}
        <TabsContent value="audit-log" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Audit Trail</CardTitle>
              <CardDescription>
                Immutable record of all system events (most recent first)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-150">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Aggregate ID</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLoading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : auditData?.items?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No audit events recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditData?.items?.map((entry: AuditEntryView) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                            {new Date(entry.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getEventColor(entry.event_type)}>
                              {getEventIcon(entry.event_type)}{" "}
                              {entry.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-50 truncate font-mono text-sm">
                            {entry.aggregate_id}
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.performed_by}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {entry.aggregate_type}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Quality Tab */}
        <TabsContent value="data-quality" className="mt-0 space-y-4">
          {dataQualityMetrics.mismatches > 0 ||
          dataQualityMetrics.missingDocs > 0 ? (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="size-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {dataQualityMetrics.mismatches + dataQualityMetrics.missingDocs}{" "}
                compliance item
                {dataQualityMetrics.mismatches +
                  dataQualityMetrics.missingDocs !==
                1
                  ? "s"
                  : ""}{" "}
                require attention: {dataQualityMetrics.mismatches} mismatches,{" "}
                {dataQualityMetrics.missingDocs} EDD cases.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="size-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All compliance checks current. System in good standing.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Risk Classification Mismatches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {dataQualityMetrics.mismatches}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Clients where computed tier differs from declared tier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Clients Requiring EDD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {dataQualityMetrics.missingDocs}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enhanced Due Diligence cases pending
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-4">
                  <span className="text-sm font-medium">HIGH Risk</span>
                  <div className="text-2xl font-bold text-red-600">
                    {dataQualityMetrics.highRisk}
                  </div>
                  <p className="text-xs text-red-600">
                    {(
                      (dataQualityMetrics.highRisk /
                        dataQualityMetrics.totalClients || 0) * 100
                    ).toFixed(1)}
                    % of portfolio
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg bg-amber-50 p-4">
                  <span className="text-sm font-medium">MEDIUM Risk</span>
                  <div className="text-2xl font-bold text-amber-600">
                    {clientsData?.items?.filter(
                      (c) => c.computed_tier === "MEDIUM"
                    ).length || 0}
                  </div>
                  <p className="text-xs text-amber-600">
                    {(
                      ((clientsData?.items?.filter(
                        (c) => c.computed_tier === "MEDIUM"
                      ).length || 0) / dataQualityMetrics.totalClients || 0) *
                      100
                    ).toFixed(1)}
                    % of portfolio
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg bg-green-50 p-4">
                  <span className="text-sm font-medium">LOW Risk</span>
                  <div className="text-2xl font-bold text-green-600">
                    {clientsData?.items?.filter(
                      (c) => c.computed_tier === "LOW"
                    ).length || 0}
                  </div>
                  <p className="text-xs text-green-600">
                    {(
                      ((clientsData?.items?.filter(
                        (c) => c.computed_tier === "LOW"
                      ).length || 0) / dataQualityMetrics.totalClients || 0) *
                      100
                    ).toFixed(1)}
                    % of portfolio
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity by User</CardTitle>
              <CardDescription>
                Number of audit events per system user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uniqueActors.map((actor) => {
                  const actorCount =
                    auditData?.items?.filter((e) => e.performed_by === actor)
                      .length || 0
                  return (
                    <div
                      key={actor}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{actor}</span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-48 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${
                                (actorCount / (auditMetrics.totalEvents || 1) ||
                                  0) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="min-w-12 text-right text-sm font-bold">
                          {actorCount}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries({
                  ONBOARDING_CREATED: auditMetrics.onboardingEvents,
                  KYC_STATUS_CHANGED: auditMetrics.kycChanges,
                  RISK_RECLASSIFIED: auditMetrics.riskChanges,
                  CORRECTION_SUBMITTED: auditMetrics.corrections,
                }).map(([eventType, count]) => (
                  <div
                    key={eventType}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getEventIcon(eventType)}</span>
                      <span className="text-sm font-medium">{eventType}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-48 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{
                            width: `${
                              (count / (auditMetrics.totalEvents || 1) || 0) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="min-w-12 text-right text-sm font-bold">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

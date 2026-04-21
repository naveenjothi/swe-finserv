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
import { Button } from "@/components/ui/button"
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
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react"
import { typedApi } from "@/shared/api/generated/typed-client"
import { KycStatusBadge } from "@/features/kyc/components/kyc-status-badge"
import type { components } from "@/shared/api/generated/sentinel-api.types"

type KycCaseView = components["schemas"]["KycCaseView"]
type PaginatedKycCaseView = components["schemas"]["PaginatedKycCaseView"]
type PaginatedClientView = components["schemas"]["PaginatedClientView"]

export default function Component() {
  const [activeTab, setActiveTab] = useState<string>("overview")

  // Fetch KYC cases
  const { data: kycData, isLoading: kycLoading } = useQuery({
    queryKey: ["kyc-cases"],
    queryFn: async () => {
      const response = await typedApi.GET("/api/kyc", {
        params: { query: { page: 1, pageSize: 100 } },
      })
      return response.data as PaginatedKycCaseView
    },
  })

  // Fetch clients list
  const { data: clientsData } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await typedApi.GET("/api/clients", {
        params: { query: { page: 1, pageSize: 100 } },
      })
      return response.data as PaginatedClientView
    },
  })

  // Calculate metrics
  const metrics = {
    totalClients: clientsData?.items?.length || 0,
    highRiskCount:
      clientsData?.items?.filter((c) => c.computed_tier === "HIGH").length || 0,
    eddCasesCount: kycData?.items?.filter((k) => k.requires_edd).length || 0,
    pendingApprovalCount:
      kycData?.items?.filter((k) => k.kyc_status === "PENDING").length || 0,
    missingDocsCount:
      clientsData?.items?.filter((c) => c.requires_edd).length || 0,
  }

  const eddCases = kycData?.items?.filter((k) => k.requires_edd) || []
  const pendingCases =
    kycData?.items?.filter((k) => k.kyc_status === "PENDING") || []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor KYC status, EDD cases, and compliance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
            <CardDescription>Across all branches</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="size-4 text-risk-high" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-risk-high">
              {metrics.highRiskCount}
            </div>
            <CardDescription>Require enhanced oversight</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">EDD Cases</CardTitle>
            <CheckCircle className="size-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {metrics.eddCasesCount}
            </div>
            <CardDescription>Awaiting sign-off</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Clock className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {metrics.pendingApprovalCount}
            </div>
            <CardDescription>Awaiting review</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requires EDD</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.missingDocsCount}</div>
            <CardDescription>Clients needing review</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Tabs: Overview, EDD Queue, Pending Approvals */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edd" className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            EDD Queue ({metrics.eddCasesCount})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="size-4" />
            Pending ({metrics.pendingApprovalCount})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>
                Current risk classification across all clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-risk-high text-white">HIGH</Badge>
                    <span className="text-sm font-medium">
                      {metrics.highRiskCount} clients
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PEP, sanctions, or adverse media
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-risk-medium text-white">MEDIUM</Badge>
                    <span className="text-sm font-medium">
                      {clientsData?.items?.filter(
                        (c) => c.computed_tier === "MEDIUM"
                      ).length || 0}{" "}
                      clients
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entity or high-income sources
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-risk-low text-white">LOW</Badge>
                    <span className="text-sm font-medium">
                      {clientsData?.items?.filter(
                        (c) => c.computed_tier === "LOW"
                      ).length || 0}{" "}
                      clients
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Standard due diligence
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                KYC Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {["APPROVED", "PENDING", "ENHANCED_DUE_DILIGENCE"].map(
                  (status) => {
                    const count =
                      kycData?.items?.filter((k) => k.kyc_status === status)
                        .length || 0
                    return (
                      <div key={status} className="flex flex-col gap-2">
                        <span className="text-sm font-medium">{status}</span>
                        <div className="text-2xl font-bold">{count}</div>
                      </div>
                    )
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EDD Queue Tab */}
        <TabsContent value="edd" className="mt-0 space-y-4">
          {eddCases.length > 0 && (
            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="size-4 text-warning" />
              <AlertDescription>
                {eddCases.length} client{eddCases.length !== 1 ? "s" : ""}{" "}
                require senior compliance sign-off for account activation.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Enhanced Due Diligence Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-150">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>EDD Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : eddCases.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No EDD cases pending
                        </TableCell>
                      </TableRow>
                    ) : (
                      eddCases.map((kycCase: KycCaseView) => (
                        <TableRow key={kycCase.id}>
                          <TableCell className="font-medium">
                            {kycCase.client_name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {kycCase.reason || "Enhanced review required"}
                          </TableCell>
                          <TableCell>
                            <KycStatusBadge status={kycCase.kyc_status} />
                          </TableCell>
                          <TableCell className="text-sm">
                            {kycCase.updated_by}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(kycCase.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Review
                            </Button>
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

        {/* Pending Approvals Tab */}
        <TabsContent value="pending" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending KYC Approvals</CardTitle>
              <CardDescription>
                Clients awaiting KYC status review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-150">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Current Status</TableHead>
                      <TableHead>Previous Status</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : pendingCases.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No pending approvals
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingCases.map((kycCase: KycCaseView) => (
                        <TableRow key={kycCase.id}>
                          <TableCell className="font-medium">
                            {kycCase.client_name}
                          </TableCell>
                          <TableCell>
                            <KycStatusBadge status={kycCase.kyc_status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {kycCase.previous_status || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {kycCase.updated_by}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(kycCase.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Approve
                            </Button>
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
      </Tabs>
    </div>
  )
}

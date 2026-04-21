import { useParams, Link } from "react-router"
import { useClient } from "@/features/onboarding/api/onboarding.api"
import { RiskBadge } from "@/features/onboarding/components/risk-badge"
import { KycStatusBadge } from "@/features/kyc/components/kyc-status-badge"
import { RoleGate } from "@/components/feedback/role-gate"
import type { KycStatus } from "@/shared/types/onboarding.types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, AlertTriangle } from "lucide-react"

export function Component() {
  const { id } = useParams<{ id: string }>()
  const { data: client, isLoading } = useClient(id!)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!client) {
    return <p className="text-muted-foreground">Client not found.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.client_name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{client.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge tier={client.computed_tier} />
          {client.requires_edd && (
            <Badge variant="destructive">EDD Required</Badge>
          )}
          {client.mismatch && <Badge variant="destructive">Mismatch</Badge>}
          <RoleGate allowed={["RM"]}>
            <Button variant="outline" asChild>
              <Link to={`/clients/${id}/review`}>
                <Edit data-icon="inline-start" />
                Submit Correction
              </Link>
            </Button>
          </RoleGate>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="corrections">Corrections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 flex flex-col gap-6">
          {client.requires_edd && client.kyc_status !== "APPROVED" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>EDD Approval Required</AlertTitle>
              <AlertDescription>
                This record is incomplete. Enhanced Due Diligence approval from
                a Compliance Officer is required before client activation.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{client.client_type}</dd>
                  <dt className="text-muted-foreground">Country</dt>
                  <dd>{client.country_of_tax_residence}</dd>
                  <dt className="text-muted-foreground">Annual Income</dt>
                  <dd>£{client.annual_income.toLocaleString()}</dd>
                  <dt className="text-muted-foreground">Source of Funds</dt>
                  <dd>{client.source_of_funds}</dd>
                  <dt className="text-muted-foreground">Submitted By</dt>
                  <dd>{client.submitted_by}</dd>
                  <dt className="text-muted-foreground">Rules Version</dt>
                  <dd className="font-mono text-xs">{client.rules_version}</dd>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Risk & Compliance</CardTitle>
                  {client.kyc_status && (
                    <KycStatusBadge status={client.kyc_status as KycStatus} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <dl className="mb-4 grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">PEP Status</dt>
                  <dd>{client.pep_status ? "Yes" : "No"}</dd>
                  <dt className="text-muted-foreground">Sanctions Match</dt>
                  <dd>{client.sanctions_screening_match ? "Yes" : "No"}</dd>
                  <dt className="text-muted-foreground">Adverse Media</dt>
                  <dd>{client.adverse_media_flag ? "Yes" : "No"}</dd>
                  {client.declared_tier && (
                    <>
                      <dt className="text-muted-foreground">Declared Tier</dt>
                      <dd>
                        <RiskBadge tier={client.declared_tier} />
                      </dd>
                    </>
                  )}
                </dl>

                {client.requires_edd && (
                  <RoleGate allowed={["COMPLIANCE_OFFICER"]}>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="my-2 text-primary"
                    >
                      <Link to="/kyc">Go to KYC Dashboard</Link>
                    </Button>
                  </RoleGate>
                )}

                {client.triggered_rules &&
                  client.triggered_rules.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="mb-2 text-sm font-medium">
                          Triggered Rules
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {client.triggered_rules.map((rule) => (
                            <Badge
                              key={rule.code}
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {rule.code}: {rule.description}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Full history of changes to this record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Connect to load audit data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corrections" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Correction History</CardTitle>
              <CardDescription>
                Previous corrections and re-classifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Connect to load correction data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

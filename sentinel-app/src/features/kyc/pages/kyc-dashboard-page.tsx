import { useState } from "react"
import { useKycQueue, useUpdateKyc } from "@/features/kyc/api/kyc.api"
import { KycStatusBadge } from "@/features/kyc/components/kyc-status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { AlertTriangle, Edit, CheckCircle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import type { KycStatus } from "@/shared/types/onboarding.types"
import type { KycRecord } from "@/shared/types/kyc.types"

// Quick inline components for tabs
export function Component() {
  const [activeTab, setActiveTab] = useState<string>("all")

  const { data, isLoading } = useKycQueue({
    page: 1,
    status: activeTab === "edd" ? "ENHANCED_DUE_DILIGENCE" : undefined,
  })

  const updateKyc = useUpdateKyc()
  const [editingRecord, setEditingRecord] = useState<KycRecord | null>(null)
  const [newStatus, setNewStatus] = useState<KycStatus>("PENDING")
  const [reason, setReason] = useState("")

  const handleUpdate = async () => {
    if (!editingRecord) return
    try {
      await updateKyc.mutateAsync({
        client_id: editingRecord.client_id,
        kyc_status: newStatus,
        reason,
      })
      toast.success("KYC status updated")
      setEditingRecord(null)
      setReason("")
    } catch {
      toast.error("Failed to update KYC status")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">KYC Dashboard</h1>
        <p className="text-muted-foreground">
          Manage KYC statuses and analyze pending enhanced due diligence (EDD)
          cases.
        </p>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Cases</TabsTrigger>
          <TabsTrigger value="edd" className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            EDD Queue
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-0 outline-none">
          {/* Table is shared */}
        </TabsContent>
        <TabsContent value="edd" className="mt-0 outline-none">
          <Alert className="text-warning-foreground mb-4 border-warning/50 bg-warning/10">
            <AlertTriangle className="size-4 !text-warning" />
            <AlertDescription className="ml-2 font-medium">
              Clients requiring Enhanced Due Diligence explicitly need a
              Compliance Officer&apos;s thorough manual review and explicit
              approval.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client ID</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Current Status</TableHead>
            <TableHead>Requirements</TableHead>
            <TableHead>Updated By</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead className="w-24 border-none text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : data?.items.map((record) => (
                <TableRow key={record.id}>
                  <TableCell
                    className="max-w-[120px] truncate font-mono text-sm"
                    title={record.client_id}
                  >
                    {record.client_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record.client_name}
                  </TableCell>
                  <TableCell>
                    <KycStatusBadge status={record.kyc_status} />
                  </TableCell>
                  <TableCell>
                    {record.requires_edd ? (
                      <Alert className="inline-flex items-center gap-1 border-0 bg-transparent p-0">
                        <AlertTriangle className="size-4 text-warning" />
                        <AlertDescription className="text-sm font-semibold text-warning">
                          EDD Required
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Standard
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className="max-w-[120px] truncate text-sm"
                    title={record.updated_by}
                  >
                    {record.updated_by}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(record.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {record.kyc_status === "ENHANCED_DUE_DILIGENCE" ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="text-warning-foreground w-full bg-warning hover:bg-warning/80"
                        onClick={() => {
                          setEditingRecord(record)
                          setNewStatus("APPROVED")
                        }}
                      >
                        <CheckCircle className="mr-2 size-4" />
                        Approve EDD
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRecord(record)
                          setNewStatus(record.kyc_status)
                        }}
                      >
                        <Edit data-icon="inline-start" /> Modify
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          {data?.items.length === 0 && !isLoading && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                No records found for the current query.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update KYC Status</DialogTitle>
            <DialogDescription>
              Change KYC status for {editingRecord?.client_name}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>New Status</FieldLabel>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as KycStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="ENHANCED_DUE_DILIGENCE">
                      Enhanced Due Diligence
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Reason</FieldLabel>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for status change..."
                required
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateKyc.isPending || !reason}
            >
              {updateKyc.isPending && <Spinner data-icon="inline-start" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
import { AlertTriangle, Edit } from "lucide-react"
import { toast } from "sonner"
import type { KycStatus } from "@/shared/types/onboarding.types"
import type { KycRecord } from "@/shared/types/kyc.types"

export function Component() {
  const { data, isLoading } = useKycQueue({ page: 1 })
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
      <div>
        <h1 className="text-2xl font-semibold">KYC Dashboard</h1>
        <p className="text-muted-foreground">
          Manage KYC statuses and enhanced due diligence
        </p>
      </div>

      <Separator />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client ID</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Current Status</TableHead>
            <TableHead>Requires EDD</TableHead>
            <TableHead>Updated By</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead className="w-12" />
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
                  <TableCell className="font-mono text-sm">
                    {record.client_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record.client_name}
                  </TableCell>
                  <TableCell>
                    <KycStatusBadge status={record.kyc_status} />
                  </TableCell>
                  <TableCell>
                    {record.requires_edd && (
                      <Alert className="inline-flex items-center gap-1 border-0 bg-transparent p-0">
                        <AlertTriangle className="size-4 text-warning" />
                        <AlertDescription className="text-sm">
                          EDD Required
                        </AlertDescription>
                      </Alert>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{record.updated_by}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(record.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRecord(record)
                        setNewStatus(record.kyc_status)
                      }}
                    >
                      <Edit data-icon="inline-start" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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

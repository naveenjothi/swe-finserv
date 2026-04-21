import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { KycStatus } from "@/shared/types/onboarding.types"

const statusConfig: Record<KycStatus, { label: string; className: string }> = {
  APPROVED: {
    label: "Approved",
    className: "bg-success text-white",
  },
  PENDING: {
    label: "Pending",
    className: "bg-warning text-white",
  },
  DOCUMENTS_REQUESTED: {
    label: "Docs Requested",
    className: "bg-warning/80 text-white",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "bg-primary-light text-white",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-risk-high text-white",
  },
  ENHANCED_DUE_DILIGENCE: {
    label: "EDD",
    className: "bg-secondary text-secondary-foreground",
  },
}

export function KycStatusBadge({ status }: { status: KycStatus }) {
  const config = statusConfig[status]

  return <Badge className={cn(config.className)}>{config.label}</Badge>
}

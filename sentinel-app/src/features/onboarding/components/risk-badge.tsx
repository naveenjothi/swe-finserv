import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RiskTier } from "@/shared/types/onboarding.types"

const tierConfig: Record<RiskTier, { label: string; className: string }> = {
  HIGH: {
    label: "HIGH",
    className: "bg-risk-high text-white",
  },
  MEDIUM: {
    label: "MEDIUM",
    className: "bg-risk-medium text-white",
  },
  LOW: {
    label: "LOW",
    className: "bg-risk-low text-white",
  },
}

export function RiskBadge({ tier }: { tier: RiskTier }) {
  const config = tierConfig[tier]
  if (!config) return <Badge variant="outline">{tier ?? "—"}</Badge>
  return <Badge className={cn(config.className)}>{config.label}</Badge>
}

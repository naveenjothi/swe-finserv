import { Navigate } from "react-router"
import { useRole } from "@/shared/hooks/use-role"
import { lazy, Suspense } from "react"

const ComplianceOfficerDashboard = lazy(
  () => import("./compliance-officer-dashboard")
)
const AuditorDashboard = lazy(() => import("./auditor-dashboard"))

// Fallback loading component
function LoadingDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Loading Dashboard...</h1>
      </div>
    </div>
  )
}

export function Component() {
  const role = useRole()

  // RM role redirects to onboarding
  if (role === "RM") {
    return <Navigate to="/onboarding/new" replace />
  }

  // Render role-specific dashboards
  if (role === "COMPLIANCE_OFFICER") {
    return (
      <Suspense fallback={<LoadingDashboard />}>
        <ComplianceOfficerDashboard />
      </Suspense>
    )
  }

  if (role === "AUDITOR") {
    return (
      <Suspense fallback={<LoadingDashboard />}>
        <AuditorDashboard />
      </Suspense>
    )
  }

  // Unauthenticated - redirect to login
  return <Navigate to="/auth/login" replace />
}

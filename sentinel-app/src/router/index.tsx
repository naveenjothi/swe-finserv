import { createBrowserRouter } from "react-router"
import { AppShell } from "@/components/layout/app-shell"
import { RoleGuard } from "./role-guard"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        lazy: () => import("@/features/dashboard/pages/dashboard-page"),
      },
      {
        path: "onboarding/new",
        lazy: () => import("@/features/onboarding/pages/onboarding-page"),
      },
      {
        path: "onboarding/import",
        lazy: () => import("@/features/onboarding/pages/csv-import-page"),
      },
      {
        path: "clients",
        lazy: () => import("@/features/onboarding/pages/client-list-page"),
      },
      {
        path: "clients/:id",
        lazy: () => import("@/features/onboarding/pages/client-detail-page"),
      },
      {
        path: "clients/:id/review",
        lazy: () => import("@/features/onboarding/pages/correction-page"),
      },
      {
        path: "kyc",
        lazy: () => import("@/features/kyc/pages/kyc-dashboard-page"),
      },
      {
        path: "audit",
        lazy: () => import("@/features/audit/pages/audit-page"),
      },
      {
        path: "rules",
        lazy: () => import("@/features/rules-admin/pages/rules-admin-page"),
      },
    ],
  },
])

export { RoleGuard }

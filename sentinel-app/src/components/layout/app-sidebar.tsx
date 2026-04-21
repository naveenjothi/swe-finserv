import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  UserPlus,
  Upload,
  Users,
  Landmark,
  FileText,
  Settings,
} from "lucide-react"
import { Link, useLocation } from "react-router"
import { useAuthStore } from "@/stores/auth.store"
import { useOfflineStore } from "@/stores/offline.store"
import { RoleGate } from "@/components/feedback/role-gate"
import { Separator } from "@/components/ui/separator"
import { ROLE_LABELS } from "@/shared/constants/roles"

export function AppSidebar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const pendingCount = useOfflineStore((s) => s.pendingRecords.length)

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-start gap-2">
          <Landmark className="mt-0.5 size-5 text-sidebar-primary" />
          <div className="leading-tight">
            <div className="text-sm font-bold text-sidebar-primary">
              Halcyon Capital Partners
            </div>
            <div className="text-xs font-normal text-sidebar-foreground/80">
              SENTINEL Onboarding
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <Link to="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <RoleGate allowed={["RM"]}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/onboarding/new"}
                  >
                    <Link to="/onboarding/new">
                      <UserPlus />
                      <span>New Record</span>
                    </Link>
                  </SidebarMenuButton>
                  {pendingCount > 0 && (
                    <SidebarMenuBadge>{pendingCount}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              </RoleGate>

              <RoleGate allowed={["COMPLIANCE_OFFICER"]}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/onboarding/import"}
                  >
                    <Link to="/onboarding/import">
                      <Upload />
                      <span>Import CSV</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </RoleGate>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/clients"}
                >
                  <Link to="/clients">
                    <Users />
                    <span>Client List</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <RoleGate allowed={["COMPLIANCE_OFFICER"]}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/kyc"}
                  >
                    <Link to="/kyc">
                      <Landmark />
                      <span>KYC Queue</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </RoleGate>

              <RoleGate allowed={["AUDITOR", "COMPLIANCE_OFFICER"]}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/audit"}
                  >
                    <Link to="/audit">
                      <FileText />
                      <span>Audit Log</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </RoleGate>

              <RoleGate allowed={["COMPLIANCE_OFFICER"]}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/rules"}
                  >
                    <Link to="/rules">
                      <Settings />
                      <span>Rules Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </RoleGate>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        {user && (
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">{user.name}</div>
            {role && (
              <div className="text-xs text-muted-foreground">
                {ROLE_LABELS[role]}
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

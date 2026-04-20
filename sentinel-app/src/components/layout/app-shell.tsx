import { Outlet } from "react-router"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { OfflineBanner } from "@/components/feedback/offline-banner"
import { StaleCacheBanner } from "@/components/feedback/stale-cache-banner"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <OfflineBanner />
        <StaleCacheBanner />
        <TopBar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

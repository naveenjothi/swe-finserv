import { useEffect } from "react"
import { Outlet } from "react-router"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { OfflineBanner } from "@/components/feedback/offline-banner"
import { StaleCacheBanner } from "@/components/feedback/stale-cache-banner"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useUiStore } from "@/stores/ui.store"
import { useRulesStore } from "@/stores/rules.store"

export function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const pollRules = useRulesStore((s) => s.pollRules)

  useEffect(() => {
    pollRules()
    const handleOnline = () => pollRules()
    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [pollRules])

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
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

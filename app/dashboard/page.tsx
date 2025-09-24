// app/dashboard/page.tsx
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import React from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listMembers } from "@/lib/circle-headless"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  // Server-side fetch for count only (fast, cheap)
  let totalMembers: number | undefined
  const memberStats: { admins: number; moderators: number; newThisWeek: number } = {
    admins: 0,
    moderators: 0,
    newThisWeek: 0
  }

  try {
    const { count } = await listMembers({ page: 1, per_page: 1 })
    totalMembers = count
    
    // Get first page to calculate basic stats
    const membersData = await listMembers({ page: 1, per_page: 50 })
    memberStats.admins = membersData.records.filter(m => m.roles.admin).length
    memberStats.moderators = membersData.records.filter(m => m.roles.moderator).length
    // Note: newThisWeek would need additional logic based on join dates if available
    
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    totalMembers = undefined
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards 
                totalMembers={totalMembers} 
                memberStats={memberStats}
              />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
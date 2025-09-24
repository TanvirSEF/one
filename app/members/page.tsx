"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import React, { useEffect, useState } from "react"

export default function MembersPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveData, setLiveData] = useState<{ id: number; header: string; type: string; status: string; invitedBy: string; referrer: string }[] | null>(null)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [perPage, setPerPage] = useState(300)

  // Current user information (should come from authentication context in real app)
  const currentUser = { name: "Richard Aasum", email: "aasum85@gmail.com" }

  async function fetchMembers(nextPage = page, nextPerPage = perPage) {
    try {
      setLoading(true)
      setError(null)
      const url = `/api/circle/members?page=${nextPage}&per_page=${nextPerPage}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const json = await res.json()
      // Map headless members list to DataTable row shape
      const rows = Array.isArray(json.records)
        ? json.records.map((m: {
            community_member_id: number
            name: string
            roles?: { admin?: boolean; moderator?: boolean }
            invitedBy?: string
          }) => ({
            id: m.community_member_id,
            header: m.name || 'Unknown Member',
            // No country in headless response; leave placeholder
            type: 'Unknown',
            status: m.roles?.admin ? 'Admin' : (m.roles?.moderator ? 'Moderator' : 'Active'),
            invitedBy: m.invitedBy || 'N/A',
            referrer: 'N/A',
          }))
        : []
      setLiveData(rows)
      if (typeof json.page_count === 'number') setPageCount(json.page_count)
    } catch (e: unknown) {
      setError((e as Error)?.message || "Unable to load members")
      console.error("/api/circle/members error", e)
    } finally {
      setLoading(false)
    }
  }

  // Load members on component mount
  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage])

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
              {loading && (
                <div className="px-4 lg:px-6">Loading members…</div>
              )}
              {error && (
                <div className="px-4 lg:px-6 text-red-500">
                  {error}
                </div>
              )}
              <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="text-sm text-muted-foreground">Live data</div>
                <button
                  className="text-sm underline"
                  onClick={() => fetchMembers(1, perPage)}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
              <DataTable
                data={liveData || []}
                currentUser={currentUser}
                serverPagination={liveData && liveData.length ? {
                  pageIndex: page - 1,
                  pageSize: perPage,
                  pageCount: pageCount ?? undefined,
                  hasNextPage: pageCount ? page < pageCount : true,
                  onPageChange: (pageIndex, pageSize) => {
                    const next = pageIndex + 1
                    setPage(next)
                    setPerPage(pageSize)
                    fetchMembers(next, pageSize)
                  },
                  onPageSizeChange: (size) => {
                    setPerPage(size)
                    setPage(1)
                    fetchMembers(1, size)
                  }
                } : undefined}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

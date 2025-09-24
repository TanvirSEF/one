"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconDashboard,
  IconUsers,
} from "@tabler/icons-react"


import { NavMain } from "@/components/nav-main"

import { NavUser } from "@/components/nav-user"
import { useSession } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Richard Aasum",
    email: "aasum85@gmail.com",
    avatar: "https://assets-v2.circle.so/zu759vqw6x5t9rc8e938ccr3q6x9",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "All Members",
      url: "/members",
      icon: IconUsers,
    },
  ],
}

export function AppSidebar({ 
  ...props 
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const user = session?.user || data.user
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2 w-full justify-center"
            >
              <a href="#" className="flex justify-center w-full">
                <Image 
                  src="/1move-logo.png" 
                  alt="1Move Logo" 
                  width={120}
                  height={40}
                  className="w-full max-w-[120px] h-auto object-contain"
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user?.name || data.user.name,
          email: user?.email || data.user.email,
          avatar: data.user.avatar,
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}

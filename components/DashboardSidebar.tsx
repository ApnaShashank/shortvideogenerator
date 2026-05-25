"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Clapperboard,
  Video,
  BookOpen,
  CreditCard,
  Settings,
  Sparkles,
  User,
  Plus,
  LayoutTemplate,
  Music
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function DashboardSidebar() {
  const pathname = usePathname()

  const items = [
    { title: "Series", url: "/dashboard/series", icon: Clapperboard },
    { title: "Videos", url: "/dashboard/videos", icon: Video },
    { title: "Lyrics Reels", url: "/dashboard/lyrics", icon: Music },
    { title: "Guides", url: "/dashboard/guides", icon: BookOpen },
    { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ]


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutTemplate className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">LyricsFlow AI</span>
        </div>

      </SidebarHeader>
      <SidebarContent>
        <div className="px-3 py-2">
            <Button className="w-full justify-start gap-2 shadow-sm" size="lg" asChild>
                <Link href="/dashboard/create">
                    <Plus className="h-4 w-4" />
                    <span className="font-semibold">Create New Series</span>
                </Link>
            </Button>
        </div>
        <SidebarMenu className="px-2 gap-2">
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    size="lg"
                    tooltip={item.title}
                    className="data-[active=true]:bg-muted data-[active=true]:text-primary"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-base font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
         <SidebarMenu className="px-2 gap-2">
            <SidebarMenuItem>
                <SidebarMenuButton 
                    size="lg" 
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    asChild
                >
                    <Link href="/dashboard/billing">
                        <Sparkles className="h-5 w-5" />
                        <span className="font-semibold">Upgrade Plan</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                    <Link href="/dashboard/profile">
                        <User className="h-5 w-5" />
                        <span className="font-medium">Profile Settings</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

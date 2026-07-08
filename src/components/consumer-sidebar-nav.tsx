"use client"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Wallet, Trophy, LifeBuoy, Settings } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

const menuItems = [
  { href: "/consumer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/consumer/rewards", label: "Rewards", icon: Wallet },
  { href: "/consumer/leaderboard", label: "Leaderboard", icon: Trophy },
];

const bottomMenuItems = [
    { href: "/consumer/support", label: "Support", icon: LifeBuoy },
    { href: "/consumer/profile", label: "Settings", icon: Settings },
]

export function ConsumerSidebarNav() {
  const pathname = usePathname()

  return (
    <>
        <SidebarMenu>
        {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
        </SidebarMenu>
        <div className="flex-grow" />
        <SidebarMenu>
        {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
               <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
               >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
        </SidebarMenu>
    </>
  )
}

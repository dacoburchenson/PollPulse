"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings, LayoutDashboard } from "lucide-react"
import { SidebarTrigger } from "./ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function AppHeader() {
  const pathname = usePathname();
  const isConsumer = pathname.startsWith('/consumer');
  const dashboardHref = isConsumer ? "/consumer/dashboard" : "/dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
        <div className="flex-1">
            {/* Can add breadcrumbs or search here */}
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar>
                        <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{isConsumer ? "Consumer User" : "Brand User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {isConsumer ? "consumer@example.com" : "brand@example.com"}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref}><LayoutDashboard />Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={isConsumer ? "/consumer/profile" : "/profile"}><User />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={isConsumer ? "/consumer/profile" : "/profile"}><Settings />Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/login"><LogOut />Log out</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </header>
  )
}

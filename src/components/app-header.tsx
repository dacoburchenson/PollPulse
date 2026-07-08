"use client"

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, User as UserIcon, Settings, LayoutDashboard } from "lucide-react"
import { SidebarTrigger } from "./ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth";

export function AppHeader() {
  const pathname = usePathname();
  const isConsumer = pathname.startsWith('/consumer');
  const dashboardHref = isConsumer ? "/consumer/dashboard" : "/dashboard";
  const [firebaseUser, setFirebaseUser] = useState<import("firebase/auth").User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  const displayName = firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || "User";
  const displayEmail = firebaseUser?.email || "";
  const initials = displayName.substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    await signOut(auth);
  };

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
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {displayEmail}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref}><LayoutDashboard />Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={isConsumer ? "/consumer/profile" : "/profile"}><UserIcon />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={isConsumer ? "/consumer/profile" : "/profile"}><Settings />Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut />Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </header>
  )
}

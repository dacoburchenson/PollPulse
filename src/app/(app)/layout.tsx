import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { SidebarNav } from "@/components/sidebar-nav";
import { Logo } from "@/components/logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <div className="flex-1">
        <AppHeader />
        <main className="p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

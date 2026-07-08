import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { ConsumerSidebarNav } from "@/components/consumer-sidebar-nav";
import { Logo } from "@/components/logo";

export default function ConsumerAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <ConsumerSidebarNav />
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

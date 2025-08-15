"use client";

import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Refrigerator,
  ChefHat,
  Calendar,
  Leaf,
  Settings,
  CircleUser,
} from "lucide-react";
import { ForkAndLeaf } from "@/components/icons";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/inventory", label: "Inventory", icon: Refrigerator },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/planner", label: "Meal Planner", icon: Calendar },
  { href: "/sustainability", label: "Sustainability", icon: Leaf },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <ForkAndLeaf className="w-8 h-8 text-primary" />
              <h2 className="text-xl font-bold text-primary group-data-[collapsible=icon]:hidden">
                SmartBite
              </h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <Separator className="my-2" />
             <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Settings">
                        <Settings />
                        <span>Settings</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Profile">
                        <CircleUser />
                        <span>John Doe</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background/95">
           <div className="md:hidden mb-4">
             <SidebarTrigger />
           </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

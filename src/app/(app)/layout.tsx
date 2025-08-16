
"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Refrigerator,
  ChefHat,
  Calendar,
  Leaf,
  Settings,
  CircleUser,
  PanelLeft,
} from "lucide-react";
import { ForkAndLeaf } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/inventory", label: "Inventory", icon: Refrigerator },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/planner", label: "Meal Planner", icon: Calendar },
  { href: "/sustainability", label: "Sustainability", icon: Leaf },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 w-72">
            <SheetHeader className="p-4 border-b">
                 <SheetTitle className="sr-only">Main Menu</SheetTitle>
                 <div className="flex items-center gap-2">
                    <ForkAndLeaf className="w-8 h-8 text-primary" />
                    <h2 className="text-xl font-bold text-primary">SmartBite</h2>
                </div>
            </SheetHeader>
            
            <nav className="grid gap-2 text-lg font-medium p-4">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSheetOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    pathname === item.href && "bg-muted text-primary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-4 border-t">
               <nav className="grid gap-2 text-lg font-medium">
                  <Link
                    href="#"
                    onClick={() => setIsSheetOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                   <Link
                    href="#"
                    onClick={() => setIsSheetOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    <CircleUser className="h-5 w-5" />
                    John Doe
                  </Link>
               </nav>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center justify-center">
           <ForkAndLeaf className="w-8 h-8 text-primary" />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Refrigerator,
  ChefHat,
  Calendar,
  HeartPulse,
  Settings,
  CircleUser,
  PanelLeft,
  Utensils,
  LogOut,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";
import { ForkAndLeaf } from "@/components/icons";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/inventory", label: "Inventory", icon: Refrigerator },
  { href: "/bill-scanner", label: "Bill Scanner", icon: ReceiptText },
  { href: "/plate-scanner", label: "Plate Scanner", icon: Utensils },
  { href: "/shopping-helper", label: "Shopping Helper", icon: ShoppingCart },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/planner", label: "Meal Planner", icon: Calendar },
  { href: "/health", label: "Health & Impact", icon: HeartPulse },
  { href: "/settings", label: "Settings", icon: Settings },
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
                 <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
                    <ForkAndLeaf className="w-8 h-8 text-primary" />
                    <h2 className="text-xl font-bold text-primary">SmartBite</h2>
                </Link>
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
                    href="/login"
                    onClick={() => {
                        setIsSheetOpen(false)
                        // Add Firebase logout logic here if needed
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-destructive transition-all hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Link>
               </nav>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center justify-end gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
                <ForkAndLeaf className="w-8 h-8 text-primary" />
                <span className="sr-only">SmartBite</span>
            </Link>
            <div className="flex-1"></div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <CircleUser className="h-5 w-5" />
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="text-destructive focus:text-destructive">Logout</Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}

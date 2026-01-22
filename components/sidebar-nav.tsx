"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  Settings,
  ClipboardList,
  Home,
  ShoppingCart,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Entities",
    href: "/entities",
    icon: Building2,
  },
  {
    title: "Waste Types",
    href: "/waste-types",
    icon: Settings,
  },
  {
    title: "Waste Stream Agreements",
    href: "/agreements",
    icon: FileText,
  },
  {
    title: "Order Types",
    href: "/settings/order-types",
    icon: ClipboardList,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-4 bg-card border-r border-border min-h-screen w-64 shrink-0">
      <div className="mb-6 px-3">
        <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
      </div>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}

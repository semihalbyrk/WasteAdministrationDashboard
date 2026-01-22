"use client"

import Link from "next/link"
import { useApp } from "@/lib/store"
import { useEntities } from "@/lib/entities-store"
import { useOrders } from "@/lib/orders-store"
import { useOrderTypes } from "@/lib/order-types-store"
import { Card } from "@/components/ui/card"
import { Settings, FileText, ClipboardList, ShoppingCart, Building2 } from "lucide-react"
import { SidebarNav } from "./sidebar-nav"

interface DashboardCard {
  id: string
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
}

export function Dashboard() {
  const { agreements, wasteTypes } = useApp()
  const { entities } = useEntities()
  const { orders } = useOrders()
  const { orderTypes } = useOrderTypes()

  const dashboardCards: DashboardCard[] = [
    {
      id: "waste-types",
      title: "Waste Types",
      subtitle: "Master data",
      description: "Manage waste type definitions and EWC codes",
      icon: <Settings className="h-8 w-8" />,
      href: "/waste-types",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "agreements",
      title: "Agreements",
      subtitle: "Commercial contracts",
      description: "Manage waste flow contracts and ASN validation",
      icon: <FileText className="h-8 w-8" />,
      href: "/agreements",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "order-types",
      title: "Order Types",
      subtitle: "Order templates",
      description: "Configure order type templates with compliance settings",
      icon: <ClipboardList className="h-8 w-8" />,
      href: "/settings/order-types",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "orders",
      title: "Orders",
      subtitle: "Waste collection orders",
      description: "Create and manage waste collection orders",
      icon: <ShoppingCart className="h-8 w-8" />,
      href: "/orders",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "entities",
      title: "Entities",
      subtitle: "Master data",
      description: "Manage companies and their roles in waste transactions",
      icon: <Building2 className="h-8 w-8" />,
      href: "/entities",
      color: "bg-emerald-50 text-emerald-600",
    },
  ]

  const stats = [
    { label: "Entities", value: entities.length },
    { label: "Waste Types", value: wasteTypes.length },
    { label: "Agreements", value: agreements.length },
    { label: "Order Types", value: orderTypes.length },
    { label: "Orders", value: orders.length },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="px-6 py-8">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              Waste Management Platform
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Enterprise waste stream administration
            </p>
          </div>
        </div>

        <div className="px-6 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-4">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="text-3xl font-semibold text-foreground mt-1">{stat.value}</div>
              </Card>
            ))}
          </div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards.map((card) => (
              <Link key={card.id} href={card.href}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {card.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    {card.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Additional Info Section */}
          <div className="mt-12 grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Quick Start
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-emerald-600">→</span>
                  <span>Create entities (companies and organizations)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">→</span>
                  <span>Configure waste types with EWC codes</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">→</span>
                  <span>Set up waste stream agreements</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">→</span>
                  <span>Create order types with compliance settings</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">→</span>
                  <span>Generate and manage orders</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                System Info
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="text-muted-foreground">Data Storage:</span>
                  <span className="ml-2 font-medium">Browser localStorage</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Compliance:</span>
                  <span className="ml-2 font-medium">Netherlands LMA</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Entities Seeded:</span>
                  <span className="ml-2 font-medium">13 companies</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Waste Types Seeded:</span>
                  <span className="ml-2 font-medium">4 types</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import { AppProvider } from "@/lib/store"
import { EntitiesProvider } from "@/lib/entities-store"
import { OrdersProvider } from "@/lib/orders-store"
import { OrderTypesProvider } from "@/lib/order-types-store"
import { RoutesProvider } from "@/lib/routes-store"
import { TasksProvider } from "@/lib/tasks-store"
import "./globals.css"

export const metadata: Metadata = {
  title: "Waste Management Platform",
  description: "Enterprise waste stream administration",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <EntitiesProvider>
            <OrdersProvider>
              <OrderTypesProvider>
                <RoutesProvider>
                  <TasksProvider>
                    {children}
                  </TasksProvider>
                </RoutesProvider>
              </OrderTypesProvider>
            </OrdersProvider>
          </EntitiesProvider>
        </AppProvider>
      </body>
    </html>
  )
}

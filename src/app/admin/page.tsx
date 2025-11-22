import { getAdminStats, getRevenueSeries, getOrdersByStatusBreakdown, adminListOrders } from "@/lib/actions/admin";
import { formatPaise } from "@/lib/payments";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { RevenueChart } from "./revenue-chart";
import { StatusPieChart } from "./status-pie-chart";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const [statsResult, revenueResult, statusResult, recentResult] = await Promise.all([
    getAdminStats(),
    getRevenueSeries(30),
    getOrdersByStatusBreakdown(),
    adminListOrders({}),
  ]);

  const stats = statsResult.success ? statsResult.data : null;
  const revenueSeries = revenueResult.success ? revenueResult.data : [];
  const statusBreakdown = statusResult.success ? statusResult.data : [];
  const recentOrders = recentResult.success ? recentResult.data.slice(0, 5) : [];

  const KPI_CARDS = stats
    ? [
        {
          title: "Total Revenue",
          value: formatPaise(stats.totalRevenuePaise),
          sub: `${stats.paidOrders} paid orders`,
          icon: TrendingUp,
          iconBg: "bg-primary/10",
          iconColor: "text-primary",
        },
        {
          title: "Total Orders",
          value: stats.totalOrders.toString(),
          sub: `${stats.pendingOrders} pending`,
          icon: ShoppingBag,
          iconBg: "bg-[oklch(0.62_0.19_55)/15]",
          iconColor: "text-[oklch(0.62_0.19_55)]",
        },
        {
          title: "Products",
          value: stats.totalProducts.toString(),
          sub: stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : "All in stock",
          icon: Package,
          iconBg: "bg-[oklch(0.62_0.18_210)/15]",
          iconColor: "text-[oklch(0.62_0.18_210)]",
          alert: stats.lowStockCount > 0,
        },
        {
          title: "Customers",
          value: stats.totalCustomers.toString(),
          sub: "Registered accounts",
          icon: Users,
          iconBg: "bg-[oklch(0.55_0.18_145)/15]",
          iconColor: "text-[oklch(0.55_0.18_145)]",
        },
      ]
    : [];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of your store performance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
          <div
            key={card.title}
            className="bg-card border border-border rounded-lg p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <card.icon size={17} className={card.iconColor} />
              </div>
              {card.alert && (
                <AlertTriangle size={14} className="text-[oklch(0.62_0.19_55)]" />
              )}
            </div>
            <p className="text-3xl font-bold font-mono tabular-nums">{card.value}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{card.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Revenue area chart */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-base font-semibold mb-1">Revenue (Last 30 days)</h2>
          <p className="text-xs text-muted-foreground mb-4">Daily revenue from paid orders</p>
          <RevenueChart data={revenueSeries} />
        </div>

        {/* Status pie */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-base font-semibold mb-1">Orders by Status</h2>
          <p className="text-xs text-muted-foreground mb-4">Current order status breakdown</p>
          <StatusPieChart data={statusBreakdown} />
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th scope="col" className="text-left font-medium text-muted-foreground px-5 py-3">Order</th>
                  <th scope="col" className="text-left font-medium text-muted-foreground px-5 py-3">Customer</th>
                  <th scope="col" className="text-left font-medium text-muted-foreground px-5 py-3">Date</th>
                  <th scope="col" className="text-left font-medium text-muted-foreground px-5 py-3">Status</th>
                  <th scope="col" className="text-right font-medium text-muted-foreground px-5 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders`}
                        className="text-primary hover:underline font-mono text-xs"
                      >
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      {format(new Date(order.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums font-medium">
                      {formatPaise(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

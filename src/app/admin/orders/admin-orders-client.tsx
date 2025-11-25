"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { updateOrderStatus } from "@/lib/actions/admin";
import { format } from "date-fns";
import type { AdminOrderItem } from "@/lib/actions/admin";
import Link from "next/link";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

interface AdminOrdersClientProps {
  initialOrders: AdminOrderItem[];
  activeStatus: string;
  formatPaise: (p: number) => string;
}

export function AdminOrdersClient({
  initialOrders,
  activeStatus,
  formatPaise,
}: AdminOrdersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!newStatus) return;
    setUpdatingId(orderId);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success(`Order status updated to ${newStatus.toLowerCase()}`);
        startTransition(() => router.refresh());
      } else {
        toast.error(result.error);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">{initialOrders.length} orders</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap mb-6 border-b border-border pb-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/orders${tab.value ? `?status=${tab.value}` : ""}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-3">Order</th>
                <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-3">Customer</th>
                <th scope="col" className="text-left font-medium text-muted-foreground px-4 py-3">Date</th>
                <th scope="col" className="text-center font-medium text-muted-foreground px-4 py-3">Items</th>
                <th scope="col" className="text-right font-medium text-muted-foreground px-4 py-3">Total</th>
                <th scope="col" className="text-center font-medium text-muted-foreground px-4 py-3">Status</th>
                <th scope="col" className="text-right font-medium text-muted-foreground px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No orders found
                  </td>
                </tr>
              ) : (
                initialOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-primary">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{order.shippingCity}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {order.itemCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                      {formatPaise(order.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Select
                          value={order.status}
                          onValueChange={(v) => {
                            if (!v || v === order.status) return;
                            handleStatusChange(order.id, v);
                          }}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s.charAt(0) + s.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

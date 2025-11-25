import { adminListOrders } from "@/lib/actions/admin";
import { formatPaise } from "@/lib/payments";
import { AdminOrdersClient } from "./admin-orders-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Orders",
};

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "";

  const result = await adminListOrders(statusFilter ? { status: statusFilter } : {});
  const orders = result.success ? result.data : [];

  return (
    <div className="p-6 lg:p-8">
      <AdminOrdersClient
        initialOrders={orders}
        activeStatus={statusFilter}
        formatPaise={formatPaise}
      />
    </div>
  );
}

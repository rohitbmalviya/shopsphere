"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { OrderStatusBreakdown } from "@/lib/actions/admin";

interface StatusPieChartProps {
  data: OrderStatusBreakdown[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "oklch(0.48 0.02 272)",
  PAID: "oklch(0.55 0.18 145)",
  SHIPPED: "oklch(0.52 0.24 272)",
  DELIVERED: "oklch(0.50 0.22 245)",
  CANCELLED: "oklch(0.62 0.22 10)",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No order data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    status: d.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] ?? "oklch(0.48 0.02 272)"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(1 0 0)",
            border: "1px solid oklch(0.90 0.01 272)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value, name) => [value as number, name as string]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "11px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { RevenueDataPoint } from "@/lib/actions/admin";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function formatAxisPaise(value: number): string {
  if (value === 0) return "₹0";
  if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`;
  if (value >= 100) return `₹${(value / 100).toFixed(0)}`;
  return `₹${value}`;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    date: format(parseISO(d.date), "dd MMM"),
    revenue: d.revenuePaise / 100, // convert to rupees for display
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.52 0.24 272)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="oklch(0.52 0.24 272)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 272 / 60%)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "oklch(0.48 0.02 272)" }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(data.length / 6)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "oklch(0.48 0.02 272)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatAxisPaise}
          width={55}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(1 0 0)",
            border: "1px solid oklch(0.90 0.01 272)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value) => [`₹${Number(value ?? 0).toLocaleString("en-IN")}`, "Revenue"]}
          labelStyle={{ fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="oklch(0.52 0.24 272)"
          strokeWidth={2}
          fill="url(#primaryGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "oklch(0.52 0.24 272)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

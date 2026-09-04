"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

type TrendPoint = {
  offset: number;
  label: string;
  summary: {
    totalReports: number;
    onTimeReports: number;
    lateReports: number;
    onTimePercentage: number;
    avgResolutionHours: number;
  };
};

type GroupSummary = {
  id: string;
  name: string;
  totalReports: number;
  onTimeReports: number;
  lateReports: number;
  onTimePercentage: number;
  avgResolutionHours: number;
};

export function VillagePerformanceTrendChart({ trend }: { trend: TrendPoint[] }) {
  const hasData = trend.some((point) => point.summary.totalReports > 0);

  const chartData = trend.map((point) => ({
    label: point.label,
    "Tepat Waktu": point.summary.onTimeReports,
    Terlambat: point.summary.lateReports,
  }));

  if (!hasData) {
    return <EmptyChart />;
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip content={<TrendTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="Tepat Waktu"
            stackId="1"
            stroke="var(--success)"
            fill="var(--success)"
            fillOpacity={0.35}
          />
          <Area
            type="monotone"
            dataKey="Terlambat"
            stackId="1"
            stroke="var(--danger)"
            fill="var(--danger)"
            fillOpacity={0.35}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VillagePerformanceRankingChart({
  data,
}: {
  data: GroupSummary[];
}) {
  if (data.length === 0) {
    return <EmptyChart />;
  }

  const chartData = data
    .slice(0, 8)
    .map((item) => ({ label: item.name, value: Math.round(item.onTimePercentage) }));

  const maxLabelLength = Math.max(...chartData.map((item) => item.label.length), 10);

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} allowDecimals={false} unit="%" />
          <YAxis
            type="category"
            dataKey="label"
            width={Math.min(maxLabelLength * 8, 150)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<RankingTooltip />} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="var(--primary)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VillagePerformanceBreakdownTable({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: GroupSummary[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <p className="text-sm font-medium text-foreground">Belum ada data</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tidak ada laporan selesai pada periode ini.
            </p>
          </div>
        ) : (
          <>
            <VillagePerformanceRankingChart data={data} />

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-semibold">Nama</th>
                    <th className="py-2 pr-4 font-semibold">Total</th>
                    <th className="py-2 pr-4 font-semibold">Tepat Waktu</th>
                    <th className="py-2 pr-4 font-semibold">Terlambat</th>
                    <th className="py-2 pr-4 font-semibold">% Tepat Waktu</th>
                    <th className="py-2 pr-4 font-semibold">Rata-rata Jam</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {data.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {item.name}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {item.totalReports}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {item.onTimeReports}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {item.lateReports}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {Math.round(item.onTimePercentage)}%
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {item.avgResolutionHours.toFixed(1)} jam
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs text-muted-foreground">
          {entry.name}: {entry.value} laporan
        </p>
      ))}
    </div>
  );
}

function RankingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: { label?: string; value?: number } }[];
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{item?.label}</p>
      <p className="text-xs text-muted-foreground">{item?.value}% tepat waktu</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-center">
      <div>
        <p className="text-sm font-medium text-foreground">Belum ada data chart</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Chart akan muncul setelah ada laporan selesai pada periode ini.
        </p>
      </div>
    </div>
  );
}

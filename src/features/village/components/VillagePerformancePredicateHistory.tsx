import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import type { PerformancePredicateRecord } from "@/src/features/village/queries";

const PERIOD_TYPE_LABELS: Record<string, string> = {
  bulanan: "Bulanan",
  triwulanan: "Triwulanan",
};

export function VillagePerformancePredicateHistory({
  records,
}: {
  records: PerformancePredicateRecord[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Predikat Kinerja</CardTitle>
        <CardDescription>
          Seksi dengan performa terbaik yang pernah ditentukan per periode.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Belum ada predikat yang ditentukan
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Gunakan tombol &quot;Tentukan Predikat Periode Ini&quot; untuk
              periode yang sudah selesai.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-2xl border border-border bg-muted/30 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">
                      {PERIOD_TYPE_LABELS[record.periodType] ?? record.periodType}
                    </Badge>
                    <p className="text-sm font-semibold text-foreground">
                      {formatPeriodLabel(record.periodStart, record.periodType)}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Ditentukan {formatDate(record.createdAt)}
                  </p>
                </div>

                <p className="mt-3 text-sm font-medium text-foreground">
                  {record.sectionName ?? "Seksi tidak diketahui"}
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {record.badgeLabel}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>{record.totalReports} laporan selesai</span>
                  <span>{record.onTimeReports} tepat waktu</span>
                  <span>{record.lateReports} terlambat</span>
                  <span>{record.avgResolutionHours.toFixed(1)} jam rata-rata</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatPeriodLabel(periodStartIso: string, periodType: string) {
  const start = new Date(periodStartIso);

  if (periodType === "triwulanan") {
    const quarter = Math.floor(start.getUTCMonth() / 3) + 1;
    return `Triwulan ${quarter} ${start.getUTCFullYear()}`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(start);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Gauge, Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { VillageStatCard } from "@/src/features/village/components/VillageStatCard";
import { VillagePerformanceFilterBar } from "@/src/features/village/components/VillagePerformanceFilterBar";
import {
  VillagePerformanceBreakdownTable,
  VillagePerformanceTrendChart,
} from "@/src/features/village/components/VillagePerformanceCharts";
import { VillagePerformancePredicateButton } from "@/src/features/village/components/VillagePerformancePredicateButton";
import { VillagePerformancePredicateHistory } from "@/src/features/village/components/VillagePerformancePredicateHistory";
import {
  getPerformancePredicateHistory,
  getVillagePerformanceData,
} from "@/src/features/village/queries";
import {
  getPeriodOptions,
  PERFORMANCE_PERIOD_OPTION_COUNT,
  type PerformancePeriodType,
} from "@/src/lib/performancePeriod";

type VillagePerformancePageProps = {
  searchParams: Promise<{
    tipe?: string;
    periode?: string;
  }>;
};

const DEFAULT_OFFSET = 1;

export default async function VillagePerformancePage({
  searchParams,
}: VillagePerformancePageProps) {
  const params = await searchParams;

  const periodType: PerformancePeriodType =
    params.tipe === "triwulanan" ? "triwulanan" : "bulanan";
  const periodOffset = params.periode !== undefined ? Number(params.periode) : DEFAULT_OFFSET;

  const [data, predicateHistory, periodOptions] = await Promise.all([
    getVillagePerformanceData({
      periodType,
      periodOffset: Number.isFinite(periodOffset) ? periodOffset : DEFAULT_OFFSET,
    }),
    getPerformancePredicateHistory(),
    Promise.resolve(
      getPeriodOptions(periodType, PERFORMANCE_PERIOD_OPTION_COUNT[periodType]).map(
        (option) => ({ offset: option.offset, label: option.label })
      )
    ),
  ]);

  const { summary, bySection, byCategory, trend, selectedPeriod } = data;

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/dashboard/village"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke dashboard desa
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">Evaluasi Kinerja</p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Evaluasi Kinerja Penanganan Laporan
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Pantau persentase penyelesaian tepat waktu, tren antar periode,
              dan perbandingan performa antar seksi maupun kategori laporan.
              {selectedPeriod ? ` Periode terpilih: ${selectedPeriod.label}.` : ""}
            </p>
          </div>

          <VillagePerformancePredicateButton />
        </div>
      </section>

      <VillagePerformanceFilterBar periodOptions={periodOptions} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <VillageStatCard
          title="Laporan Selesai"
          value={summary.totalReports}
          description="Total laporan resolved pada periode ini."
          icon={<Gauge className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Tepat Waktu"
          value={`${summary.onTimeReports} (${Math.round(summary.onTimePercentage)}%)`}
          description="Diselesaikan sebelum batas SLA."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Terlambat"
          value={`${summary.lateReports} (${
            summary.totalReports > 0
              ? Math.round((summary.lateReports / summary.totalReports) * 100)
              : 0
          }%)`}
          description="Diselesaikan melewati batas SLA."
          icon={<Timer className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Rata-rata Penyelesaian"
          value={`${summary.avgResolutionHours.toFixed(1)} jam`}
          description="Rata-rata waktu dari laporan dibuat hingga selesai."
          icon={<Clock3 className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Tren Penyelesaian Antar Periode</CardTitle>
          <CardDescription>
            Perbandingan jumlah laporan tepat waktu vs terlambat dari periode
            ke periode.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <VillagePerformanceTrendChart trend={trend} />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <VillagePerformanceBreakdownTable
          title="Performa per Seksi"
          description="Perbandingan persentase tepat waktu antar seksi desa pada periode ini."
          data={bySection}
        />

        <VillagePerformanceBreakdownTable
          title="Performa per Kategori"
          description="Perbandingan persentase tepat waktu antar kategori laporan pada periode ini."
          data={byCategory}
        />
      </section>

      <VillagePerformancePredicateHistory records={predicateHistory} />
    </div>
  );
}

import Link from "next/link";
import {
  ArrowLeft,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  GitMerge,
  PauseCircle,
  Timer,
} from "lucide-react";
import { VillageSlaTable } from "@/src/features/village/components/VillageSlaTable";
import { VillageSlaAlertButton } from "@/src/features/village/components/VillageSlaAlertButton";
import { VillageStatCard } from "@/src/features/village/components/VillageStatCard";
import { getVillageSlaMonitoringData } from "@/src/features/village/queries";
import { getOpenSwadayaCampaignReportIds } from "@/src/features/reports/swadayaQueries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function VillageSlaPage() {
  const [{ totalReports, slaStats, reports }, openSwadayaCampaignReportIds] =
    await Promise.all([
      getVillageSlaMonitoringData(),
      getOpenSwadayaCampaignReportIds(),
    ]);

  const onTimeCount = getCount(slaStats, "on_time");
  const atRiskCount = getCount(slaStats, "at_risk");
  const criticalCount = getCount(slaStats, "critical");
  const overdueCount = getCount(slaStats, "overdue");
  const completedCount = getCount(slaStats, "completed");
  const mergedCount = getCount(slaStats, "merged");
  const notSetCount = getCount(slaStats, "not_set");

  // Cabang 5a: "paused_budget" dipakai ulang untuk 2 sumber jeda (lihat
  // rasionalisasi di CLAUDE.md) — kartu statistik dipecah dua supaya
  // konsisten dengan label per-baris di tabel di bawahnya, bukan cuma
  // menghitung semuanya sebagai "Jeda Anggaran".
  const pausedSwadayaCount = reports.filter(
    (report) =>
      report.sla_status === "paused_budget" &&
      openSwadayaCampaignReportIds.includes(report.id)
  ).length;
  const pausedBudgetCount = getCount(slaStats, "paused_budget") - pausedSwadayaCount;

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
            <p className="text-sm font-semibold text-primary">Monitoring SLA</p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Monitoring Tingkat Layanan
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Pantau status SLA laporan, termasuk batas waktu aktif, jeda
              anggaran, duplikasi yang digabung, dan alur yang selesai.
            </p>
          </div>

          <VillageSlaAlertButton />
        </div>
      </section>

      {notSetCount > 0 && (
        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
          Beberapa laporan belum memiliki batas waktu SLA. Ini wajar untuk
          laporan yang masih menunggu review admin atau belum masuk alur
          berbatas waktu.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-9">
        <VillageStatCard
          title="Total Laporan"
          value={totalReports}
          description="Semua laporan dalam monitoring."
          icon={<Timer className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Tepat Waktu"
          value={onTimeCount}
          description="Laporan yang masih dalam batas SLA."
          icon={<Clock3 className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Berisiko"
          value={atRiskCount}
          description="Laporan yang mendekati batas SLA."
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Kritis"
          value={criticalCount}
          description="Laporan yang hampir melewati batas SLA."
          icon={<AlertOctagon className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Terlambat"
          value={overdueCount}
          description="Laporan yang melewati batas SLA."
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Selesai"
          value={completedCount}
          description="Alur yang sudah selesai."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Jeda Anggaran"
          value={pausedBudgetCount}
          description="SLA dijeda karena anggaran."
          icon={<PauseCircle className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Jeda Swadaya"
          value={pausedSwadayaCount}
          description="SLA dijeda karena galang swadaya."
          icon={<PauseCircle className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Digabung"
          value={mergedCount}
          description="Mengikuti laporan master."
          icon={<GitMerge className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Daftar SLA Laporan</CardTitle>
          <CardDescription>
            Menampilkan status SLA, batas verifikasi, dan batas penyelesaian
            laporan.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <VillageSlaTable
            reports={reports}
            openSwadayaCampaignReportIds={openSwadayaCampaignReportIds}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function getCount(items: { label: string; count: number }[], label: string) {
  return items.find((item) => item.label === label)?.count ?? 0;
}

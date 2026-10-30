import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  Clock3,
  FileText,
  Send,
  Timer,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { CitizenStatCard } from "@/src/features/citizen/components/CitizenStatCard";
import { CreateReportModal } from "@/src/features/reports/components/CreateReportModal";
import { getCitizenDashboardData } from "@/src/features/citizen/queries";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { Badge } from "@/src/components/ui/Badge";

export default async function PublicDashboardPage() {
  const { reports, stats } = await getCitizenDashboardData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Masyarakat</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Beranda Saya
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Kirim laporan masyarakat dan pantau perkembangan terbaru dari
            laporan yang sudah Anda kirim ke desa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/public/sla">
            <Button variant="outline">
              <Timer className="mr-2 h-4 w-4" />
              Statistik SLA
            </Button>
          </Link>

          <Link href="/dashboard/public/reports">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Laporan Saya
            </Button>
          </Link>

          <CreateReportModal />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CitizenStatCard
          title="Total Laporan"
          value={stats.totalReports}
          description="Semua laporan yang Anda kirim."
          icon={<FileText className="h-5 w-5" />}
        />

        <CitizenStatCard
          title="Menunggu"
          value={stats.pendingReports}
          description="Menunggu pemeriksaan admin."
          icon={<Clock3 className="h-5 w-5" />}
        />

        <CitizenStatCard
          title="Diproses"
          value={stats.inProcessReports}
          description="Sedang ditangani petugas."
          icon={<Send className="h-5 w-5" />}
        />

        <CitizenStatCard
          title="Selesai"
          value={stats.resolvedReports}
          description="Laporan yang sudah diselesaikan."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <CitizenStatCard
          title="Diarsipkan"
          value={stats.archivedReports}
          description="Laporan yang masuk arsip."
          icon={<Archive className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Terbaru</CardTitle>
          <CardDescription>
            Menampilkan laporan terbaru yang Anda kirim.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
              <p className="text-sm font-semibold text-foreground">
                Belum ada laporan terbaru
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Buat laporan pertama untuk mulai memantau progresnya.
              </p>

              <div className="mt-5 flex justify-center">
                <CreateReportModal />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {report.title}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.report_number}
                    </p>
                  </div>

                  <StatusBadge status={report.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  type StatusKey = keyof typeof REPORT_STATUS_LABELS;

  return (
    <Badge
      className={
        REPORT_STATUS_BADGE_CLASSES[status as StatusKey] ??
        "bg-muted text-muted-foreground border-border"
      }
    >
      {REPORT_STATUS_LABELS[status as StatusKey] ?? status}
    </Badge>
  );
}

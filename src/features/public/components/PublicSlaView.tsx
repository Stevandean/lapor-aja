"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
  Timer,
  X,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { CreateReportModal } from "@/src/features/reports/components/CreateReportModal";
import type { PublicSlaComplianceStats } from "@/src/features/public/queries";

type PublicSlaViewProps = {
  stats: PublicSlaComplianceStats;
  isDashboardView?: boolean;
};

export function PublicSlaView({
  stats,
  isDashboardView = false,
}: PublicSlaViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return stats.byCategory;
    }
    const q = searchQuery.toLowerCase().trim();
    return stats.byCategory.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [stats.byCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Bar / Breadcrumb */}
      {!isDashboardView && (
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <CreateReportModal buttonLabel="Kirim Laporan" buttonSize="sm" />
        </div>
      )}

      {/* Header Info */}
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">
              Transparansi Pelayanan Publik
            </span>
            {stats.isUsingDemoFallback && (
              <Badge variant="warning" className="text-[11px]">
                Data Simulasi Pengujian
              </Badge>
            )}
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Statistik Kepatuhan SLA Desa
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Laporan transparansi kecepatan penanganan pengaduan masyarakat oleh
            pemerintah desa berdasarkan batas waktu layanan resmi (Service Level
            Agreement).
          </p>
        </div>

        {isDashboardView && (
          <Link href="/dashboard/public/reports">
            <Button variant="outline" size="sm" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Lihat Laporan Saya
            </Button>
          </Link>
        )}
      </section>

      {/* Demo Notification Banner if active */}
      {stats.isUsingDemoFallback && (
        <div className="rounded-xl border border-warning-100 bg-warning-50/70 p-4 text-sm text-warning-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" />
            <div className="space-y-1">
              <p className="font-semibold text-warning-800">
                Mode Simulasi Aktif
              </p>
              <p className="text-xs text-warning-700">
                Menampilkan {stats.totalReports} laporan simulasi sistem agar
                indikator kepatuhan dapat diuji. Angka statistik ini akan otomatis
                beralih ke data operasional nyata begitu laporan riil diselesaikan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metric KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Tingkat Kepatuhan SLA"
          value={`${Math.round(stats.onTimePercentage)}%`}
          subtitle={`${stats.onTimeReports} tepat waktu dari ${stats.totalReports} laporan`}
          icon={<Timer className="h-5 w-5" />}
          tone={
            stats.onTimePercentage >= 80
              ? "positive"
              : stats.onTimePercentage >= 60
                ? "neutral"
                : "critical"
          }
        />

        <MetricCard
          label="Laporan Diselesaikan"
          value={stats.totalReports.toLocaleString("id-ID")}
          subtitle={`${stats.lateReports} laporan melebihi tenggat`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="neutral"
        />

        <MetricCard
          label="Rata-rata Waktu Tanggap"
          value={`${stats.averageResolutionDays} Hari`}
          subtitle="Dihitung dari hari kerja aktif"
          icon={<Clock className="h-5 w-5" />}
          tone="neutral"
        />

        <MetricCard
          label="Kategori Masalah"
          value={stats.byCategory.length.toLocaleString("id-ID")}
          subtitle="Bidang pelayanan dipantau"
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="neutral"
        />
      </section>

      {/* Standar Target SLA Desa */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">
                Standar Batas Waktu Pelayanan Desa
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Target waktu kerja resmi penanganan laporan berdasarkan skala
                urgensi masalah.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.standards.map((standard) => {
              const prioStat = stats.byPriority.find(
                (p) => p.priority === standard.priority
              );
              return (
                <div
                  key={standard.priority}
                  className="rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Prioritas {standard.label}
                    </span>
                    {prioStat && prioStat.totalReports > 0 ? (
                      <span className="text-xs font-semibold text-primary">
                        {Math.round(prioStat.onTimePercentage)}% tepat
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Verifikasi Dusun:</span>
                      <span className="font-medium text-foreground">
                        Maks. {standard.verificationHours} Jam
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Penanganan Tuntas:</span>
                      <span className="font-medium text-foreground">
                        {standard.resolutionHours >= 24
                          ? `${Math.round(standard.resolutionHours / 24)} Hari Kerja`
                          : `${standard.resolutionHours} Jam`}
                      </span>
                    </div>
                  </div>

                  {standard.description && (
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {standard.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Kepatuhan per Kategori */}
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-base sm:text-lg">
                Kepatuhan per Kategori Masalah
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Persentase penyelesaian tepat waktu dan beban volume laporan
                pada tiap kategori.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kategori masalah..."
                className="pl-9 pr-8"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Tidak ada kategori yang cocok
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Coba ubah kata kunci pencarian Anda.
              </p>
              {searchQuery && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="mt-3"
                >
                  Reset Pencarian
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCategories.map((category) => {
                const percent = Math.round(category.onTimePercentage);
                const barColor =
                  percent >= 80
                    ? "bg-emerald-600"
                    : percent >= 60
                      ? "bg-amber-500"
                      : "bg-rose-500";

                return (
                  <div key={category.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-semibold text-foreground">
                          {category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {category.totalReports} laporan selesai &middot;{" "}
                          <span className="text-foreground">
                            {category.onTimeReports} tepat waktu
                          </span>
                          {category.lateReports > 0 && (
                            <span className="text-rose-600">
                              {" "}
                              ({category.lateReports} terlambat)
                            </span>
                          )}
                          {category.averageDays > 0 && (
                            <span>
                              {" "}
                              &middot; Rata-rata {category.averageDays} hari
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold tracking-tight text-foreground">
                          {percent}%
                        </span>
                        <Badge
                          variant={
                            percent >= 80
                              ? "success"
                              : percent >= 60
                                ? "warning"
                                : "danger"
                          }
                          className="text-[11px]"
                        >
                          {percent >= 80
                            ? "Tinggi"
                            : percent >= 60
                              ? "Cukup"
                              : "Perlu Evaluasi"}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar Minimalis */}
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Info / Edukasi Warga */}
      <div className="rounded-xl border border-border bg-muted/20 p-5 text-center text-xs leading-relaxed text-muted-foreground">
        <p>
          Perhitungan batas waktu SLA secara otomatis memperhitungkan jam kerja
          kantor desa serta melewati akhir pekan (Sabtu dan Minggu) dan hari libur
          nasional resmi. Laporan yang membutuhkan pendanaan khusus dijeda secara
          transparan selama proses penganggaran desa atau penggalangan swadaya.
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  tone?: "positive" | "neutral" | "critical";
}) {
  const toneClasses = {
    positive: "text-emerald-600 bg-emerald-50 border-emerald-100",
    neutral: "text-primary bg-primary-50 border-primary-100",
    critical: "text-rose-600 bg-rose-50 border-rose-100",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {value}
            </p>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${toneClasses[tone]}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

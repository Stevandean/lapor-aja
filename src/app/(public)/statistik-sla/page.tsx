import Link from "next/link";
import { CheckCircle2, ClipboardList, ShieldCheck } from "lucide-react";
import { getPublicSlaComplianceStats } from "@/src/features/public/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

// Cabang 4c — halaman publik, ANONIM SUNGGUHAN (tanpa login sama sekali,
// tidak ada getProfile()/requireAuth()/requireRole() di sini), mengikuti
// pola (public)/reports/create yang sudah terbukti bisa diakses tanpa
// sesi. Statistik agregat saja, TIDAK ADA detail per laporan (nomor
// laporan, nama pelapor, lokasi presisi) untuk menjaga privasi warga.
//
// PENTING: halaman ini TIDAK memanggil getProfile()/cookies apapun, jadi
// Next.js akan menganggapnya statis dan MENCETAK ANGKA SEKALI SAAT BUILD
// kalau tidak dipaksa dinamis — angka SLA wajib selalu terbaru per
// kunjungan, bukan beku sejak build terakhir.
export const dynamic = "force-dynamic";

export default async function PublicSlaStatisticsPage() {
  const stats = await getPublicSlaComplianceStats();

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary">Transparansi Publik</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Statistik Kepatuhan SLA Desa
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ringkasan seberapa cepat laporan masyarakat ditangani oleh desa,
            terbuka untuk siapa saja tanpa perlu masuk akun. Data ini murni
            laporan yang sudah selesai ditangani.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<ClipboardList className="h-5 w-5" />}
            label="Laporan Ditangani"
            value={stats.totalReports.toLocaleString("id-ID")}
          />

          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Tepat Waktu"
            value={`${Math.round(stats.onTimePercentage)}%`}
          />

          <StatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Kategori Terpantau"
            value={stats.byCategory.length.toLocaleString("id-ID")}
          />
        </section>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Kepatuhan per Kategori Laporan</CardTitle>
            <CardDescription>
              Persentase laporan yang diselesaikan tepat waktu untuk
              masing-masing jenis masalah.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {stats.byCategory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
                <p className="text-sm font-medium text-foreground">
                  Belum ada laporan yang selesai ditangani
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Statistik akan muncul setelah ada laporan yang selesai
                  diproses.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.byCategory.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.totalReports} laporan selesai
                      </p>
                    </div>

                    <p className="shrink-0 text-lg font-bold text-foreground">
                      {Math.round(category.onTimePercentage)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Punya masalah yang belum dilaporkan?{" "}
          <Link
            href="/reports/create"
            className="font-semibold text-primary hover:text-primary-700"
          >
            Kirim laporan
          </Link>
        </p>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

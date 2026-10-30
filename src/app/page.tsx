import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  FileCheck2,
  LineChart,
  LogIn,
  MapPin,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { CreateReportModal } from "@/src/features/reports/components/CreateReportModal";
import { getPublicSlaComplianceStats } from "@/src/features/public/queries";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";

const WORKFLOW_STAGES = [
  {
    step: "01",
    title: "Pelaporan dengan Titik GPS & Bukti Foto",
    actor: "Warga / Masyarakat Umum",
    description:
      "Pelapor mengirim deskripsi masalah, memilih titik koordinat di peta interaktif dalam radius 5 km dari posisi GPS, dan melampirkan 1 sampai 5 foto kondisi lapangan.",
  },
  {
    step: "02",
    title: "Verifikasi Lapangan di Tingkat Dusun",
    actor: "Kepala Dusun",
    description:
      "Kepala Dusun memeriksa keabsahan laporan di lokasi dan mengunggah dokumentasi verifikasi sebelum laporan masuk ke antrean penanganan teknis desa.",
  },
  {
    step: "03",
    title: "Klasifikasi Kewenangan & Penugasan Berbasis SLA",
    actor: "Admin Desa & Sekretaris Desa",
    description:
      "Laporan yang menjadi kewenangan desa ditugaskan ke Seksi (Kasi) terkait dengan hitung mundur jam kerja aktif. Masalah di luar aset desa diteruskan ke dinas kabupaten/kota melalui surat resmi.",
  },
  {
    step: "04",
    title: "Penyelesaian Teknis, Jeda Anggaran, atau Swadaya",
    actor: "Kasi Pelaksana & Kepala Desa",
    description:
      "Petugas memperbarui progres hingga selesai disertai bukti foto. Jika butuh pendanaan khusus, arloji SLA dijeda secara transparan selama pengajuan anggaran atau pembukaan swadaya warga.",
  },
] as const;

export default async function HomePage() {
  const profile = await getProfile();

  if (profile) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  const slaStats = await getPublicSlaComplianceStats();
  const topCategories = slaStats.byCategory.slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="container-page flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-3 text-lg font-bold tracking-tight text-foreground"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                LA
              </span>
              <span>Lapor Aja</span>
            </Link>

            <nav
              aria-label="Navigasi utama"
              className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex"
            >
              <a
                href="#alur-penanganan"
                className="transition-colors hover:text-foreground"
              >
                Alur Penanganan
              </a>
              <a
                href="#jalur-pelaporan"
                className="transition-colors hover:text-foreground"
              >
                Jalur Pelaporan
              </a>
              <a
                href="#transparansi-sla"
                className="transition-colors hover:text-foreground"
              >
                Transparansi SLA
              </a>
              <Link
                href="/statistik-sla"
                className="transition-colors hover:text-foreground"
              >
                Statistik Lengkap
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* <Link href={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <LogIn className="h-4 w-4" />
                <span>Masuk</span>
              </Button>
            </Link> */}

            <Link href={ROUTES.REGISTER} className="hidden sm:block">
              <Button variant="outline" size="sm" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                <span>Daftar Akun</span>
              </Button>
            </Link>

            <CreateReportModal buttonLabel="Buat Laporan" buttonSize="sm" />
          </div>
        </div>
      </header>

      <main>
        {/* SECTION 1: Full-Viewport Hero + Key SLA Ledger Strip */}
        <section className="flex min-h-[calc(100vh-5rem)] flex-col justify-between border-b border-border bg-card py-16 sm:py-20 lg:py-24">
          <div className="container-page my-auto">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Portal Pengaduan &amp; Evaluasi Kinerja Desa
              </p>

              <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
                Laporkan masalah lingkungan desa dengan kepastian batas waktu
                penanganan.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Sampaikan kerusakan fasilitas umum, gangguan ketertiban, atau
                kebutuhan layanan lingkungan langsung dari lokasi kejadian.
                Setiap laporan dipantau menggunakan tenggat waktu kerja resmi
                (Service Level Agreement) dari tingkat dusun hingga perangkat
                desa.
              </p>

              <div className="mt-10 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <CreateReportModal
                  buttonLabel="Buat Laporan Sekarang"
                  buttonSize="lg"
                  buttonClassName="w-full sm:w-auto"
                />

                <Link href="/statistik-sla" className="block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 sm:w-auto"
                  >
                    <LineChart className="h-4 w-4" />
                    Lihat Statistik SLA Desa
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Validasi koordinat GPS radius 5 km</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Tenggat dihitung dari jam kerja aktif desa</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  <span>Bisa melapor langsung tanpa login akun</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Ledger Strip inside Hero */}
          {/* <div className="container-page mt-16 pt-10">
            <div className="rounded-2xl border border-border bg-background/80 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Indikator Kepatuhan Pelayanan Desa Saat Ini
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Rekapitulasi penyelesaian laporan masyarakat terhadap target
                    batas waktu SLA.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {slaStats.isUsingDemoFallback ? (
                    <Badge variant="warning">Data Simulasi Pengujian</Badge>
                  ) : (
                    <Badge variant="success">Data Operasional</Badge>
                  )}
                  <Link
                    href="/statistik-sla"
                    className="text-xs font-semibold text-primary hover:text-primary-700"
                  >
                    Buka rincian lengkap
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Tingkat Kepatuhan SLA
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {Math.round(slaStats.onTimePercentage)}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {slaStats.onTimeReports} laporan selesai tepat waktu
                  </p>
                </div>

                <div className="sm:border-l sm:border-border sm:pl-6">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Laporan Diselesaikan
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {slaStats.totalReports.toLocaleString("id-ID")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {slaStats.lateReports} laporan melewati tenggat
                  </p>
                </div>

                <div className="lg:border-l lg:border-border lg:pl-6">
                  <p className="text-xs font-medium text-muted-foreground">
                    Rata-rata Waktu Penyelesaian
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {slaStats.averageResolutionDays}{" "}
                    <span className="text-lg font-semibold text-muted-foreground">
                      Hari
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dihitung dari hari kerja aktif desa
                  </p>
                </div>

                <div className="sm:border-l sm:border-border sm:pl-6">
                  <p className="text-xs font-medium text-muted-foreground">
                    Bidang Layanan Dipantau
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {slaStats.byCategory.length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kategori masalah infrastruktur &amp; sosial
                  </p>
                </div>
              </div>
            </div>
          </div> */}
        </section>

        {/* SECTION 2: Full-Viewport 4-Stage Operational Workflow */}
        <section
          id="alur-penanganan"
          className="flex min-h-screen scroll-mt-20 flex-col justify-center border-b border-border py-20 sm:py-28"
        >
          <div className="container-page">
            <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5 lg:sticky lg:top-28">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Prosedur Operasional Standar
                </p>
                <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Empat tahap penanganan yang tercatat di log audit desa.
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Tidak ada laporan yang hilang tanpa kabar. Sejak laporan
                  dikirim oleh warga, sistem mencatat siapa petugas yang
                  memverifikasi di dusun, seksi mana yang ditugaskan, hingga
                  kapan batas waktu penanganannya berakhir.
                </p>

                {/* <div className="mt-8">
                  <CreateReportModal
                    buttonLabel="Mulai Buat Laporan"
                    buttonVariant="outline"
                  />
                </div> */}
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
                {WORKFLOW_STAGES.map((item) => (
                  <div
                    key={item.step}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-primary">
                          Tahap {item.step}
                        </span>
                        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {item.actor}
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-bold leading-snug text-foreground">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Full-Viewport Reporting Paths (Public vs Citizen Account) */}
        <section
          id="jalur-pelaporan"
          className="flex min-h-screen scroll-mt-20 flex-col justify-center border-b border-border bg-card py-20 sm:py-28"
        >
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Akses Pelaporan Masyarakat
              </p>
              <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Lapor cepat tanpa akun atau masuk untuk pemantauan penuh.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Pilih cara melapor yang paling sesuai dengan kondisi Anda saat
                ini. Keduanya menggunakan formulir dan validasi peta GPS yang
                sama.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {/* Path A: Direct Public Reporting */}
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-background p-8 sm:p-10">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-foreground">
                      Lapor Cepat Tanpa Akun
                    </h3>
                    <Badge variant="info">Langsung Kirim</Badge>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Dirancang bagi warga atau pengunjung yang ingin segera
                    melaporkan temuan di lapangan tanpa perlu membuat akun atau
                    masuk terlebih dahulu.
                  </p>

                  <ul className="mt-8 space-y-4 text-sm text-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span>
                        Formulir modal langsung terbuka di halaman ini tanpa
                        pindah halaman.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span>
                        Deteksi lokasi GPS otomatis disertai pemilihan titik
                        koordinat di peta interaktif.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span>
                        Laporan langsung tercatat dan masuk ke antrean Admin
                        Desa serta Kepala Dusun.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* <div className="mt-10 border-t border-border pt-6">
                  <CreateReportModal
                    buttonLabel="Buat Laporan Tanpa Login"
                    buttonSize="lg"
                    buttonClassName="w-full sm:w-auto"
                  />
                </div> */}
              </div>

              {/* Path B: Registered Citizen Account */}
              <div className="flex flex-col justify-between rounded-2xl border border-primary/30 bg-primary-50/30 p-8 sm:p-10">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-foreground">
                      Akun Warga Terdaftar
                    </h3>
                    <Badge variant="primary">Pemantauan Penuh</Badge>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Direkomendasikan bagi warga desa agar setiap laporan
                    terhubung ke dasbor pribadi dan perkembangan tindak
                    lanjutnya dapat dipantau hingga tuntas.
                  </p>

                  <ul className="mt-8 space-y-4 text-sm text-foreground">
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span>
                        Pantau riwayat perubahan status, catatan verifikasi
                        dusun, dan bukti foto penyelesaian petugas.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span>
                        Terima pemberitahuan otomatis melalui dasbor internal,
                        Email, dan WhatsApp saat status laporan diperbarui.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span>
                        Ikut berpartisipasi dalam kampanye Swadaya Desa (uang,
                        material, logistik, atau tenaga gotong royong).
                      </span>
                    </li>
                  </ul>
                </div>

                {/* <div className="mt-10 flex flex-wrap items-center gap-3.5 border-t border-border pt-6">
                  <Link href={ROUTES.LOGIN}>
                    <Button variant="primary" size="lg" className="gap-2">
                      <LogIn className="h-4 w-4" />
                      Masuk ke Akun
                    </Button>
                  </Link>

                  <Link href={ROUTES.REGISTER}>
                    <Button variant="outline" size="lg" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Daftar Akun Warga
                    </Button>
                  </Link>
                </div> */}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Full-Viewport SLA Standards & Category Performance */}
        <section
          id="transparansi-sla"
          className="flex min-h-screen scroll-mt-20 flex-col justify-center py-20 sm:py-28"
        >
          <div className="container-page">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Transparansi Standar Layanan
                </p>
                <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Standar batas waktu SLA dan capaian per kategori masalah.
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Pemerintah desa menetapkan target waktu verifikasi dan
                  penyelesaian berdasarkan tingkat urgensi laporan, serta
                  membuka hasil capaiannya kepada publik.
                </p>
              </div>

              {/* <Link href="/statistik-sla">
                <Button variant="outline" size="lg" className="gap-2">
                  <LineChart className="h-4 w-4" />
                  Buka Halaman Statistik SLA ({slaStats.byCategory.length}{" "}
                  Kategori)
                </Button>
              </Link> */}
            </div>

            <div className="mt-12 grid items-start gap-8 lg:grid-cols-12">
              {/* Left 5 Cols: Official SLA Priority Standards */}
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:col-span-5">
                <h3 className="text-lg font-bold text-foreground">
                  Target Waktu Berdasarkan Prioritas
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Dihitung selama jam kerja aktif desa (melewati Sabtu, Minggu,
                  dan hari libur nasional).
                </p>

                <div className="mt-6 divide-y divide-border">
                  {slaStats.standards.map((std) => (
                    <div key={std.priority} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">
                          Prioritas {std.label}
                        </span>
                        <span className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                          Selesai maks.{" "}
                          {std.resolutionHours >= 24
                            ? `${Math.round(std.resolutionHours / 24)} hari kerja`
                            : `${std.resolutionHours} jam`}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Batas verifikasi dusun: maks. {std.verificationHours}{" "}
                        jam kerja
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 7 Cols: Top Categories Performance */}
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
                {topCategories.map((cat) => {
                  const pct = Math.round(cat.onTimePercentage);
                  return (
                    <div
                      key={cat.id}
                      className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base font-bold text-foreground">
                            {cat.name}
                          </p>
                          <span className="text-xl font-bold text-primary">
                            {pct}%
                          </span>
                        </div>

                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {cat.onTimeReports} tepat waktu dari{" "}
                          {cat.totalReports} laporan selesai
                        </p>
                      </div>

                      <div className="mt-5">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, pct))}%`,
                            }}
                          />
                        </div>

                        <p className="mt-2.5 text-xs text-muted-foreground">
                          Rata-rata durasi penyelesaian: {cat.averageDays} hari
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Civic Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="container-page flex flex-col justify-between gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Lapor Aja &middot; Sistem Peringatan Dini dan Evaluasi Kinerja
              Pengaduan Berbasis SLA
            </p>
            <p className="mt-1">
              Perhitungan batas waktu otomatis menyesuaikan jam kerja desa serta
              melewati akhir pekan dan hari libur nasional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
            <Link href="/statistik-sla" className="hover:text-foreground">
              Statistik SLA
            </Link>
            <Link href={ROUTES.LOGIN} className="hover:text-foreground">
              Masuk
            </Link>
            <Link href={ROUTES.REGISTER} className="hover:text-foreground">
              Daftar Akun
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

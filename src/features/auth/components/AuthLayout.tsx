import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  MapPin,
  ShieldCheck,
} from "lucide-react";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
  // Cabang 4c: slot opsional untuk link tambahan di bawah footer utama
  // (mis. link ke statistik SLA publik) — dibuat opsional supaya halaman
  // lain yang pakai layout ini (Register) tidak wajib mengisinya.
  secondaryLink?: {
    text: string;
    href: string;
  };
};

export function AuthLayout({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerHref,
  secondaryLink,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.45),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.22),transparent_32%)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative flex min-h-screen flex-col gap-15 p-10">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-lg font-bold text-white">Lapor Aja</p>
                  <p className="text-xs text-sidebar-muted">
                    Sistem Pelaporan Publik Desa
                  </p>
                </div>
              </Link>

              <div className="mt-20 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-primary-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-600" />
                  Platform layanan publik digital
                </div>

                <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-white">
                  Laporkan, verifikasi, dan pantau masalah desa dalam satu sistem.
                </h1>

                <p className="mt-6 max-w-lg text-base leading-7 text-sidebar-muted">
                  Platform pelaporan terstruktur untuk masyarakat, admin desa,
                  kepala dusun, dan pimpinan desa dalam mengelola aduan publik
                  secara transparan.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <MetricCard value="GPS" label="Lokasi laporan" />
                  <MetricCard value="FOTO" label="Bukti laporan" />
                  <MetricCard value="PANTAU" label="Progress laporan" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="space-y-3 w-1/2">
                <ProcessItem
                  icon={<ClipboardList className="h-4 w-4" />}
                  title="Kirim laporan"
                  description="Masyarakat mengirim laporan lengkap dengan foto dan lokasi."
                />
                <ProcessItem
                  icon={<MapPin className="h-4 w-4" />}
                  title="Verifikasi lapangan"
                  description="Kepala dusun memverifikasi laporan langsung di lokasi."
                />
                <ProcessItem
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  title="Tindak lanjut resmi"
                  description="Admin desa mengklasifikasi dan memproses laporan."
                />
              </div>

            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-[440px]">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-bold text-foreground">Lapor Aja</p>
                  <p className="text-xs text-muted-foreground">
                    Sistem Pelaporan Publik Desa
                  </p>
                </div>
              </Link>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold text-primary">
                Akses aman
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="section-surface p-5 sm:p-6">{children}</div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footerText}{" "}
              <Link
                href={footerHref}
                className="font-semibold text-primary hover:text-primary-700"
              >
                {footerLinkText}
              </Link>
            </p>

            {secondaryLink ? (
              <p className="mt-3 text-center text-sm">
                <Link
                  href={secondaryLink.href}
                  className="font-medium text-muted-foreground hover:text-foreground"
                >
                  {secondaryLink.text}
                </Link>
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-sidebar-muted">{label}</p>
    </div>
  );
}

function ProcessItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary-100">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-sidebar-muted">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

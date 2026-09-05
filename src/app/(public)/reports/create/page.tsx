import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportForm } from "@/src/features/reports/components/ReportForm";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole } from "@/src/lib/constants/routes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function CreateReportPage() {
  const profile = await getProfile();

  if (profile && profile.role !== "public") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary">Laporan Publik</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Buat Laporan Baru
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Kirim masalah publik seperti jalan rusak, lampu jalan mati,
            masalah sampah, drainase, atau fasilitas desa lain yang perlu
            ditangani.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Laporan</CardTitle>
            <CardDescription>
              Lengkapi deskripsi yang jelas, foto bukti, dan lokasi laporan.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ReportForm />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ingin lihat kepatuhan SLA desa dulu?{" "}
          <Link
            href="/statistik-sla"
            className="font-semibold text-primary hover:text-primary-700"
          >
            Buka statistik publik
          </Link>
        </p>
      </div>
    </main>
  );
}

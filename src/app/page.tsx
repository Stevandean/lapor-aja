import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, LineChart, LogIn, UserPlus } from "lucide-react";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function HomePage() {
  const profile = await getProfile();

  if (profile) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary">Lapor Aja</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Sistem Pelaporan Publik Desa
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Laporkan masalah publik di lingkungan desa Anda, pantau
            penanganannya, dan lihat transparansi kepatuhan SLA desa —
            semuanya dalam satu sistem.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mulai dari sini</CardTitle>
            <CardDescription>
              Pilih salah satu untuk melanjutkan.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link href={ROUTES.REPORT_CREATE} className="block">
              <Button variant="primary" className="w-full justify-start">
                <ClipboardList className="mr-2 h-4 w-4" />
                Buat Laporan
              </Button>
            </Link>

            <Link href="/statistik-sla" className="block">
              <Button variant="outline" className="w-full justify-start">
                <LineChart className="mr-2 h-4 w-4" />
                Statistik SLA
              </Button>
            </Link>

            <Link href={ROUTES.LOGIN} className="block">
              <Button variant="outline" className="w-full justify-start">
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </Button>
            </Link>

            <Link href={ROUTES.REGISTER} className="block">
              <Button variant="ghost" className="w-full justify-start">
                <UserPlus className="mr-2 h-4 w-4" />
                Daftar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

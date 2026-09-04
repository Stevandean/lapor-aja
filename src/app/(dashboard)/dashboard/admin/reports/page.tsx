import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { AdminReportFilterBar } from "@/src/features/admin/components/AdminReportFilterBar";
import { AdminReportTable } from "@/src/features/admin/components/AdminReportTable";
import {
  getAdminReportReviewOptions,
  getAdminReports,
  getActiveVillageSections,
} from "@/src/features/admin/queries";

type AdminReportsPageProps = {
  searchParams: Promise<{
    dusun?: string;
    kategori?: string;
    seksi?: string;
    sla?: string;
  }>;
};

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  const params = await searchParams;

  const [{ categories, hamlets }, sections, reports] = await Promise.all([
    getAdminReportReviewOptions(),
    getActiveVillageSections(),
    getAdminReports({
      dusunId: params.dusun,
      categoryId: params.kategori,
      sectionId: params.seksi,
      slaStatus: params.sla,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Laporan</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pengelolaan Laporan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tinjau, pantau, klasifikasi, dan kelola laporan masyarakat yang
            masuk ke sistem.
          </p>
        </div>
      </section>

      <AdminReportFilterBar
        categories={categories}
        dusuns={hamlets}
        sections={sections}
      />

      <Card>
        <CardHeader>
          <CardTitle>Semua Laporan</CardTitle>
          <CardDescription>
            Menampilkan laporan terbaru dari sistem pelaporan.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminReportTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}

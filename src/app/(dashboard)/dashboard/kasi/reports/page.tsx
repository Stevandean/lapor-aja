import type { ComponentProps } from "react";
import { KasiReportTable } from "@/src/features/kasi/components/KasiReportTable";
import { getKasiAssignedReports } from "@/src/features/kasi/queries";
import { getOpenSwadayaCampaignReportIds } from "@/src/features/reports/swadayaQueries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

type KasiReportTableReports = ComponentProps<typeof KasiReportTable>["reports"];

export default async function KasiReportsPage() {
  const [{ missingSection, reports }, openSwadayaCampaignReportIds] =
    await Promise.all([getKasiAssignedReports(), getOpenSwadayaCampaignReportIds()]);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Laporan Ditugaskan</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Daftar Laporan Seksi
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Lihat laporan yang ditugaskan ke seksi desa Anda dan tindak lanjuti
          sesuai status penanganannya.
        </p>
      </section>

      {missingSection ? <MissingSectionNotice /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan Ditugaskan</CardTitle>
          <CardDescription>
            Menampilkan laporan yang seksi tujuannya sesuai profil Kasi Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <KasiReportTable
            reports={reports as KasiReportTableReports}
            openSwadayaCampaignReportIds={openSwadayaCampaignReportIds}
            emptyTitle={
              missingSection ? "Penugasan seksi diperlukan" : undefined
            }
            emptyDescription={
              missingSection
                ? "Minta admin, sekdes, atau kepala desa menautkan akun Anda ke seksi desa."
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MissingSectionNotice() {
  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
      Akun Anda belum ditautkan ke seksi desa. Penugasan seksi diperlukan
      sebelum laporan dapat muncul di sini.
    </div>
  );
}

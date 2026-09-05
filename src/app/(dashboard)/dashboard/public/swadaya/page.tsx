import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { getOpenSwadayaCampaigns } from "@/src/features/reports/swadayaQueries";

export default async function PublicSwadayaListPage() {
  const campaigns = await getOpenSwadayaCampaigns();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Gotong Royong</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Bantu Warga Lain
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Daftar laporan yang sedang menggalang swadaya masyarakat karena
          belum ada anggaran desa yang mencukupi. Bantuan Anda mempercepat
          penanganannya.
        </p>
      </section>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Belum ada galang swadaya yang terbuka
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Kembali lagi nanti untuk melihat laporan yang butuh bantuan
            warga.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/dashboard/public/swadaya/${campaign.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-base">
                    {campaign.reportTitle}
                  </CardTitle>
                  <CardDescription>{campaign.reportNumber}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {campaign.categoryName ? (
                      <Badge variant="muted">{campaign.categoryName}</Badge>
                    ) : null}
                    {campaign.dusunName ? (
                      <Badge variant="muted">{campaign.dusunName}</Badge>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Terkumpul (dikonfirmasi)
                    </p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {formatRupiah(campaign.totalCollected)}
                      {campaign.targetAmount ? (
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}
                          / {formatRupiah(campaign.targetAmount)}
                        </span>
                      ) : null}
                    </p>
                    {campaign.targetAmount ? (
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (campaign.totalCollected / campaign.targetAmount) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    ) : campaign.targetNote ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Target: {campaign.targetNote}
                      </p>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {campaign.contributionCount} kontribusi tercatat
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

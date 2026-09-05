import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getSwadayaCampaignById } from "@/src/features/reports/swadayaQueries";
import { SwadayaContributionForm } from "@/src/features/reports/components/SwadayaContributionForm";

type PublicSwadayaDetailPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

export default async function PublicSwadayaDetailPage({
  params,
}: PublicSwadayaDetailPageProps) {
  const { campaignId } = await params;
  const [campaign, profile] = await Promise.all([
    getSwadayaCampaignById(campaignId),
    getProfile(),
  ]);

  if (!campaign || !profile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/public/swadaya"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar galang swadaya
      </Link>

      <section>
        <p className="text-sm font-semibold text-primary">{campaign.report.reportNumber}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {campaign.report.title}
        </h1>

        <div className="mt-3 flex flex-wrap gap-2">
          {campaign.report.categoryName ? (
            <Badge variant="muted">{campaign.report.categoryName}</Badge>
          ) : null}
          {campaign.report.dusunName ? (
            <Badge variant="muted">{campaign.report.dusunName}</Badge>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Progres Terkumpul</CardTitle>
            <CardDescription>
              Total dana yang sudah dikonfirmasi desa, belum termasuk yang
              masih menunggu verifikasi.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {formatRupiah(campaign.totalCollected)}
                {campaign.targetAmount ? (
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {formatRupiah(campaign.targetAmount)}
                  </span>
                ) : null}
              </p>

              {campaign.targetAmount ? (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((campaign.totalCollected / campaign.targetAmount) * 100)
                      )}%`,
                    }}
                  />
                </div>
              ) : campaign.targetNote ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Target: {campaign.targetNote}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Belum ada target dana spesifik untuk laporan ini.
                </p>
              )}

              {campaign.totalPending > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  + {formatRupiah(campaign.totalPending)} menunggu verifikasi
                </p>
              ) : null}
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Kontribusi non-tunai
              </p>

              {campaign.contributions.filter((c) => c.type !== "uang").length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada kontribusi material/logistik/tenaga.
                </p>
              ) : (
                campaign.contributions
                  .filter((c) => c.type !== "uang")
                  .map((contribution) => (
                    <div
                      key={contribution.id}
                      className="rounded-xl border border-border bg-muted/30 p-3 text-sm"
                    >
                      <p className="font-medium text-foreground">
                        {contribution.contributorName} —{" "}
                        {formatContributionSummary(contribution)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Status: {formatStatus(contribution.status)}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kirim Kontribusi</CardTitle>
            <CardDescription>
              Identitas Anda otomatis terisi dari akun yang sedang login.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <SwadayaContributionForm
              campaignId={campaign.id}
              contributorName={profile.full_name}
              contributorPhone={profile.phone_number}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function formatContributionSummary(contribution: {
  type: string;
  itemDescription: string | null;
  itemQuantity: number | null;
  itemUnit: string | null;
  availabilityNote: string | null;
}) {
  if (contribution.type === "tenaga") {
    return contribution.availabilityNote ?? "Kontribusi tenaga";
  }

  return `${contribution.itemQuantity ?? "-"} ${contribution.itemUnit ?? ""} ${contribution.itemDescription ?? ""}`.trim();
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu verifikasi",
    verified: "Terverifikasi",
    received: "Sudah diterima",
    rejected: "Ditolak",
  };

  return labels[status] ?? status;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

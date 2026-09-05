import Image from "next/image";
import { HeartHandshake } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import type { SwadayaCampaignDetail } from "@/src/features/reports/swadayaQueries";
import {
  SwadayaVerifyButton,
  SwadayaReceiveForm,
} from "@/src/features/reports/components/SwadayaContributionActions";
import { SwadayaCloseCampaignButton } from "@/src/features/reports/components/SwadayaCloseCampaignButton";

const CONTRIBUTION_TYPE_LABELS: Record<string, string> = {
  uang: "Uang",
  material: "Material",
  logistik: "Logistik",
  tenaga: "Tenaga",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Verifikasi",
  verified: "Terverifikasi",
  received: "Sudah Diterima",
  rejected: "Ditolak",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-warning-50 text-warning-700",
  verified: "bg-info-50 text-info-700",
  received: "bg-success-50 text-success-700",
  rejected: "bg-danger-50 text-danger-700",
};

// Cabang 5c/5d: ditaruh di halaman detail laporan (Admin/Village/Kasi) —
// SEMUA role yang bisa lihat detail laporan bisa lihat bagian ini
// (progres transparan, sesuai 5c), tapi tombol verifikasi/konfirmasi
// terima/tutup HANYA muncul kalau `canManage` true (Admin/Kepala
// Desa/Sekdes, sesuai 5d — Kasi bisa lihat tapi tidak bisa aksi).
export function SwadayaSection({
  campaign,
  canManage,
}: {
  campaign: SwadayaCampaignDetail;
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="h-5 w-5 text-primary" />
          Galang Swadaya Masyarakat
        </CardTitle>
        <CardDescription>
          {campaign.status === "open"
            ? "Sedang berjalan — SLA laporan ini dijeda sampai galang swadaya ditutup."
            : "Sudah ditutup."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {formatRupiah(campaign.totalCollected)}
            {campaign.targetAmount ? (
              <span className="text-base font-normal text-muted-foreground">
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
                    Math.round((campaign.totalCollected / campaign.targetAmount) * 100)
                  )}%`,
                }}
              />
            </div>
          ) : campaign.targetNote ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Target: {campaign.targetNote}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Belum ada target dana spesifik.
            </p>
          )}

          {campaign.totalPending > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              + {formatRupiah(campaign.totalPending)} menunggu verifikasi
            </p>
          ) : null}

          <p className="mt-2 text-xs text-muted-foreground">
            Dibuka {formatDateTime(campaign.openedAt)}
            {campaign.openedByName ? ` oleh ${campaign.openedByName}` : ""}
            {campaign.closedAt
              ? ` · Ditutup ${formatDateTime(campaign.closedAt)}`
              : ""}
          </p>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Daftar Kontribusi ({campaign.contributions.length})
          </p>

          {campaign.contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada kontribusi dari warga.
            </p>
          ) : (
            campaign.contributions.map((contribution) => (
              <div
                key={contribution.id}
                className="rounded-xl border border-border bg-muted/30 p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {contribution.contributorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {CONTRIBUTION_TYPE_LABELS[contribution.type] ?? contribution.type} ·{" "}
                      {formatContributionSummary(contribution)}
                    </p>
                  </div>

                  <Badge
                    className={
                      STATUS_BADGE_CLASSES[contribution.status] ??
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {STATUS_LABELS[contribution.status] ?? contribution.status}
                  </Badge>
                </div>

                {contribution.verifiedByName ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Diverifikasi oleh {contribution.verifiedByName}
                    {contribution.verifiedAt
                      ? ` · ${formatDateTime(contribution.verifiedAt)}`
                      : ""}
                  </p>
                ) : null}

                {contribution.receivedByName ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Diterima oleh {contribution.receivedByName}
                    {contribution.receivedAt
                      ? ` · ${formatDateTime(contribution.receivedAt)}`
                      : ""}
                    {contribution.receivedNote ? ` — ${contribution.receivedNote}` : ""}
                  </p>
                ) : null}

                {contribution.proofPhotoPath ? (
                  <div className="mt-2 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={contribution.proofPhotoPath}
                      alt="Bukti serah terima"
                      width={400}
                      height={300}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : null}

                {canManage ? (
                  <div className="mt-3">
                    {contribution.status === "pending" ? (
                      <SwadayaVerifyButton contributionId={contribution.id} />
                    ) : null}

                    {contribution.status === "verified" ? (
                      <SwadayaReceiveForm contributionId={contribution.id} />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        {canManage && campaign.status === "open" ? (
          <div className="border-t border-border pt-4">
            <SwadayaCloseCampaignButton campaignId={campaign.id} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatContributionSummary(contribution: {
  type: string;
  amount: number | null;
  itemDescription: string | null;
  itemQuantity: number | null;
  itemUnit: string | null;
  availabilityNote: string | null;
}) {
  if (contribution.type === "uang") {
    return formatRupiah(contribution.amount ?? 0);
  }

  if (contribution.type === "tenaga") {
    return contribution.availabilityNote ?? "-";
  }

  return `${contribution.itemQuantity ?? "-"} ${contribution.itemUnit ?? ""} ${contribution.itemDescription ?? ""}`.trim();
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

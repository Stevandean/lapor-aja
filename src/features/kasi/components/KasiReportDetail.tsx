import Image from "next/image";
import {
  CalendarDays,
  ClipboardEdit,
  ClipboardList,
  MapPin,
  Phone,
  User,
  Wallet,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { ReportLocationPreviewSection } from "@/src/features/reports/components/ReportLocationPreviewSection";
import { ReportStatusTimeline } from "@/src/features/reports/components/ReportStatusTimeline";
import { SwadayaOpenCampaignButton } from "@/src/features/reports/components/SwadayaOpenCampaignButton";
import { SwadayaSection } from "@/src/features/reports/components/SwadayaSection";
import type { SwadayaCampaignDetail } from "@/src/features/reports/swadayaQueries";
import { KasiReportActionPanel } from "@/src/features/kasi/components/KasiReportActionPanel";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

type ReporterProfile = {
  full_name: string;
  email: string;
  phone_number: string | null;
};

type ReportPhoto = {
  id: string;
  file_path: string | null;
  photo_url: string | null;
  created_at: string | null;
  signedUrl: string | null;
};

type StatusLog = {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
};

type ProgressPhoto = {
  id: string;
  progress_update_id: string;
  file_path: string | null;
  photo_url: string | null;
  created_at: string | null;
  signedUrl: string | null;
};

type ProgressUpdate = {
  id: string;
  update_type: "progress" | "budget_request" | "resolved" | string;
  title: string | null;
  note: string;
  created_by: string | null;
  created_at: string;
  photos: ProgressPhoto[];
};

type BudgetRequestItem = {
  id: string;
  budget_request_id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  created_at: string;
};

type BudgetRequest = {
  id: string;
  report_id: string;
  summary_note: string;
  total_estimated_budget: number;
  status: "submitted" | "approved" | "rejected" | string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  reviewer: {
    full_name: string | null;
    email: string | null;
  } | null;
  items: BudgetRequestItem[];
};

type KasiReportDetailData = {
  report: {
    id: string;
    report_number: string;
    title: string;
    description: string;
    status: keyof typeof REPORT_STATUS_LABELS;
    priority: keyof typeof REPORT_PRIORITY_LABELS;
    asset_status: string;
    authority_level: string;
    follow_up_type: string;
    latitude: number | string | null;
    longitude: number | string | null;
    auto_address: string | null;
    manual_address: string | null;
    internal_handling_note: string | null;
    verification_due_at: string | null;
    resolution_due_at: string | null;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
    category: RelationName[] | RelationName | null;
    hamlet: RelationName[] | RelationName | null;
    section: RelationName[] | RelationName | null;
    reporter: ReporterProfile[] | ReporterProfile | null;
  };
  photos: ReportPhoto[];
  statusLogs: StatusLog[];
  progressUpdates: ProgressUpdate[];
  budgetRequests: BudgetRequest[];
};

type KasiReportDetailProps = {
  detail: KasiReportDetailData;
  swadayaCampaign: SwadayaCampaignDetail | null;
};

export function KasiReportDetail({ detail, swadayaCampaign }: KasiReportDetailProps) {
  const { report, photos, statusLogs } = detail;
  const reporter = getReporter(report.reporter);
  const hasPendingBudgetRequest = detail.budgetRequests.some(
    (request) => request.status === "submitted"
  );
  const canOpenSwadaya =
    report.status !== "resolved" && swadayaCampaign?.status !== "open";

  return (
    <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>{report.report_number}</CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusBadgeClass(report.status)}>
                  {REPORT_STATUS_LABELS[report.status] ?? report.status}
                </Badge>

                <Badge variant="muted">
                  {REPORT_PRIORITY_LABELS[report.priority] ?? report.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="whitespace-pre-line text-sm leading-7 text-foreground">
              {report.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linimasa Status</CardTitle>
            <CardDescription>
              Riwayat penanganan dari laporan masyarakat hingga status
              penugasan seksi terbaru.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ReportStatusTimeline logs={statusLogs} />
          </CardContent>
        </Card>

        <ProgressHistory updates={detail.progressUpdates} />

        <BudgetRequestHistory requests={detail.budgetRequests} />

        <Card>
          <CardHeader>
            <CardTitle>Foto Laporan</CardTitle>
            <CardDescription>
              Bukti yang diunggah masyarakat saat membuat laporan.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {photos.length === 0 ? (
              <EmptyText text="Belum ada foto laporan." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-2xl border border-border bg-muted"
                  >
                    {photo.signedUrl ? (
                      <Image
                        src={photo.signedUrl}
                        alt="Bukti laporan"
                        width={800}
                        height={600}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                        Gambar tidak tersedia
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lokasi Laporan</CardTitle>
            <CardDescription>
              Lokasi yang dikirim masyarakat sebagai referensi penanganan
              lapangan.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ReportLocationPreviewSection
              latitude={report.latitude}
              longitude={report.longitude}
              title={report.title}
              address={report.manual_address || report.auto_address}
            />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <KasiReportActionPanel
          reportId={report.id}
          currentStatus={report.status}
          hasProgressStarted={detail.progressUpdates.length > 0}
          hasBudgetRequests={detail.budgetRequests.length > 0}
          hasPendingBudgetRequest={hasPendingBudgetRequest}
        />

        {swadayaCampaign ? (
          <SwadayaSection campaign={swadayaCampaign} canManage={false} />
        ) : null}

        {canOpenSwadaya ? (
          <SwadayaOpenCampaignButton reportId={report.id} />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Penugasan</CardTitle>
            <CardDescription>
              Informasi penanganan tingkat seksi untuk laporan ini.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <InfoItem
              icon={<ClipboardList className="h-4 w-4" />}
              label="Seksi"
              value={getRelationName(report.section)}
            />
            <InfoItem
              icon={<MapPin className="h-4 w-4" />}
              label="Dusun"
              value={getRelationName(report.hamlet)}
            />
            <InfoItem
              label="Tindak lanjut"
              value={formatEnum(report.follow_up_type)}
            />
            <InfoItem
              label="Catatan internal"
              value={report.internal_handling_note || "-"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pelapor</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <InfoItem
              icon={<User className="h-4 w-4" />}
              label="Nama"
              value={reporter?.full_name ?? "-"}
            />
            <InfoItem
              icon={<ClipboardList className="h-4 w-4" />}
              label="Email"
              value={reporter?.email ?? "-"}
            />
            <InfoItem
              icon={<Phone className="h-4 w-4" />}
              label="Nomor HP"
              value={reporter?.phone_number ?? "-"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Klasifikasi</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <InfoItem label="Kategori" value={getRelationName(report.category)} />
            <InfoItem
              label="Status aset"
              value={formatEnum(report.asset_status)}
            />
            <InfoItem
              label="Kewenangan"
              value={formatEnum(report.authority_level)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <InfoItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Batas verifikasi"
              value={
                report.verification_due_at
                  ? formatDateTime(report.verification_due_at)
                  : "-"
              }
            />
            <InfoItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Batas penyelesaian"
              value={
                report.resolution_due_at
                  ? formatDateTime(report.resolution_due_at)
                  : "-"
              }
            />
            <InfoItem
              label="Selesai"
              value={report.resolved_at ? formatDateTime(report.resolved_at) : "-"}
            />
          </CardContent>
        </Card>
      </aside>
    </section>
  );
}

function BudgetRequestHistory({ requests }: { requests: BudgetRequest[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Pengajuan Anggaran</CardTitle>
        <CardDescription>
          Pengajuan anggaran, estimasi item, dan keputusan peninjauan untuk
          laporan ini.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {requests.length === 0 ? (
          <EmptyText text="Belum ada pengajuan anggaran untuk laporan ini." />
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                      <Wallet className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(request.total_estimated_budget)}
                        </p>
                        <BudgetStatusBadge status={request.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Dikirim {formatDateTime(request.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-foreground">
                  {request.summary_note}
                </p>

                {request.items.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Item</th>
                            <th className="px-4 py-3 font-semibold">Jumlah</th>
                            <th className="px-4 py-3 font-semibold">Satuan</th>
                            <th className="px-4 py-3 font-semibold">Harga Satuan</th>
                            <th className="px-4 py-3 font-semibold">Subtotal</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-border">
                          {request.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-foreground">
                                  {item.item_name}
                                </p>
                                {item.description ? (
                                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {item.description}
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {formatNumber(item.quantity)}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {item.unit}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="px-4 py-3 font-semibold text-foreground">
                                {formatCurrency(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {request.status !== "submitted" ? (
                  <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-sm leading-6">
                    <p className="font-semibold text-foreground">
                      Ditinjau oleh {request.reviewer?.full_name ?? "Peninjau"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.reviewed_at ? formatDateTime(request.reviewed_at) : "-"}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-muted-foreground">
                      {request.review_note || "Tidak ada catatan peninjauan."}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BudgetStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "warning" | "success" | "danger" | "muted"> = {
    submitted: "warning",
    approved: "success",
    rejected: "danger",
  };
  const labels: Record<string, string> = {
    submitted: "Menunggu Peninjauan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return <Badge variant={variants[status] ?? "muted"}>{labels[status] ?? status}</Badge>;
}

function ProgressHistory({ updates }: { updates: ProgressUpdate[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Progres</CardTitle>
        <CardDescription>
          Pembaruan seksi, pengajuan anggaran, dan catatan penyelesaian yang
          dikirim oleh Kasi.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {updates.length === 0 ? (
          <EmptyText text="Belum ada update progres." />
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                      <ClipboardEdit className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {update.title || getProgressTypeLabel(update.update_type)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(update.created_at)}
                      </p>
                    </div>
                  </div>

                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-foreground">
                  {update.note}
                </p>

                {update.photos.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {update.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="overflow-hidden rounded-xl border border-border bg-muted"
                      >
                        {photo.signedUrl ? (
                          <Image
                            src={photo.signedUrl}
                            alt="Bukti progres"
                            width={640}
                            height={480}
                            className="h-44 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                            Gambar tidak tersedia
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      {icon ? <div className="mt-0.5 text-muted-foreground">{icon}</div> : null}

      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 whitespace-pre-line text-sm font-medium leading-6 text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function getReporter(
  relation: ReporterProfile[] | ReporterProfile | null
): ReporterProfile | null {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function getStatusBadgeClass(status: string) {
  type StatusKey = keyof typeof REPORT_STATUS_LABELS;

  return (
    REPORT_STATUS_BADGE_CLASSES[status as StatusKey] ??
    "bg-muted text-muted-foreground border-border"
  );
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function getProgressTypeLabel(value: string) {
  const labels: Record<string, string> = {
    progress: "Update Progres",
    resolved: "Penyelesaian",
  };

  return labels[value] ?? formatEnum(value);
}

function formatEnum(value: string | null) {
  if (!value) return "-";

  const labels: Record<string, string> = {
    aset_desa: "Aset Desa",
    bukan_aset_desa: "Bukan Aset Desa",
    belum_diketahui: "Belum Diketahui",
    desa: "Desa",
    kabupaten_kota: "Kabupaten/Kota",
    provinsi: "Provinsi",
    nasional: "Nasional",
    ditangani_desa: "Ditangani Desa",
    diteruskan_ke_dinas: "Diteruskan ke Dinas",
    diusulkan_musrenbang: "Diusulkan Musrenbang",
    menunggu_anggaran: "Menunggu Anggaran",
    belum_ditentukan: "Belum Ditentukan",
    waiting_budget: "Menunggu Anggaran",
    in_progress: "Diproses",
    resolved: "Selesai",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

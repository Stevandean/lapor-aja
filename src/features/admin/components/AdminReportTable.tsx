import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { SlaStatusBadge } from "@/src/features/reports/components/SlaStatusBadge";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

type AdminReport = {
  id: string;
  report_number: string;
  title: string;
  status: keyof typeof REPORT_STATUS_LABELS;
  priority: keyof typeof REPORT_PRIORITY_LABELS;
  asset_status: string;
  authority_level: string;
  follow_up_type: string;
  created_at: string;
  sla_status?: string | null;
  categories: RelationName[] | null;
  dusuns: RelationName[] | null;
  section?: RelationName | null;
  relation_summary?: RelationSummary;
};

type AdminReportTableProps = {
  reports: AdminReport[];
  openSwadayaCampaignReportIds?: string[];
};

type RelationSummary = {
  duplicateAsSource: number;
  duplicateAsTarget: number;
  recurrenceAsSource: number;
  recurrenceAsTarget: number;
};

export function AdminReportTable({
  reports,
  openSwadayaCampaignReportIds = [],
}: AdminReportTableProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <ClipboardList className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Belum ada laporan
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Laporan masyarakat akan muncul di sini setelah mereka mengirim laporan.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Laporan</th>
              <th className="px-5 py-4 font-semibold">Kategori</th>
              <th className="px-5 py-4 font-semibold">Dusun</th>
              <th className="px-5 py-4 font-semibold">Prioritas</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Status SLA</th>
              <th className="px-5 py-4 font-semibold">Dibuat</th>
              <th className="px-5 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {reports.map((report) => (
              <tr key={report.id} className="transition-colors hover:bg-muted/40">
                <td className="px-5 py-4">
                  <div className="max-w-xs">
                    <p className="truncate font-semibold text-foreground">
                      {report.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.report_number}
                    </p>
                    <RelationBadges summary={report.relation_summary} />
                  </div>
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {getRelationName(report.categories)}
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {getRelationName(report.dusuns)}
                </td>

                <td className="px-5 py-4">
                  <Badge variant="muted">
                    {REPORT_PRIORITY_LABELS[report.priority] ?? report.priority}
                  </Badge>
                </td>

                <td className="px-5 py-4">
                  <Badge
                    className={
                      REPORT_STATUS_BADGE_CLASSES[report.status] ??
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {REPORT_STATUS_LABELS[report.status] ?? report.status}
                  </Badge>
                </td>

                <td className="px-5 py-4">
                  <SlaStatusBadge
                    value={report.sla_status ?? null}
                    hasActiveSwadayaCampaign={openSwadayaCampaignReportIds.includes(
                      report.id
                    )}
                  />
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {formatDate(report.created_at)}
                </td>

                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/dashboard/admin/reports/${report.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
                  >
                    Detail
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {reports.map((report) => (
          <div key={report.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {report.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {report.report_number}
                </p>
                <RelationBadges summary={report.relation_summary} />
              </div>

              <SlaStatusBadge
                value={report.sla_status ?? null}
                hasActiveSwadayaCampaign={openSwadayaCampaignReportIds.includes(
                  report.id
                )}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                className={
                  REPORT_STATUS_BADGE_CLASSES[report.status] ??
                  "bg-muted text-muted-foreground"
                }
              >
                {REPORT_STATUS_LABELS[report.status] ?? report.status}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InfoItem
                label="Kategori"
                value={getRelationName(report.categories)}
              />
              <InfoItem label="Dusun" value={getRelationName(report.dusuns)} />
              <InfoItem
                label="Prioritas"
                value={REPORT_PRIORITY_LABELS[report.priority] ?? report.priority}
              />
              <InfoItem label="Dibuat" value={formatDate(report.created_at)} />
            </div>

            <Link
              href={`/dashboard/admin/reports/${report.id}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
            >
              Lihat detail
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelationBadges({ summary }: { summary?: RelationSummary }) {
  if (!summary) {
    return null;
  }

  const badges = [
    summary.duplicateAsSource > 0
      ? {
          label: "Digabung",
          className: "bg-slate-100 text-slate-700 border-slate-200",
        }
      : null,
    summary.duplicateAsTarget > 0
      ? { label: "Master", className: "bg-info-50 text-info-700 border-info-100" }
      : null,
    summary.recurrenceAsSource > 0
      ? {
          label: "Berulang",
          className: "bg-warning-50 text-warning-700 border-warning-100",
        }
      : null,
    summary.recurrenceAsTarget > 0
      ? {
          label: "Ada Pengulangan",
          className: "bg-primary-50 text-primary-700 border-primary-100",
        }
      : null,
  ].filter((badge): badge is { label: string; className: string } =>
    Boolean(badge)
  );

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <Badge key={badge.label} className={badge.className}>
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getRelationName(relation: RelationName[] | null) {
  return relation?.[0]?.name ?? "-";
}

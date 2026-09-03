import {
  AlertOctagon,
  AlertTriangle,
  ClipboardList,
  GitMerge,
  PauseCircle,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

type SlaReport = {
  id: string;
  report_number: string;
  title: string;
  status: keyof typeof REPORT_STATUS_LABELS;
  priority: keyof typeof REPORT_PRIORITY_LABELS;
  sla_status: string | null;
  verification_due_at: string | null;
  resolution_due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
};

type VillageSlaTableProps = {
  reports: SlaReport[];
};

export function VillageSlaTable({ reports }: VillageSlaTableProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <ClipboardList className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Belum ada laporan SLA
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Data monitoring SLA akan muncul setelah laporan dikirim dan diproses.
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
              <th className="px-5 py-4 font-semibold">Dusun</th>
              <th className="px-5 py-4 font-semibold">Prioritas</th>
              <th className="px-5 py-4 font-semibold">Status Alur</th>
              <th className="px-5 py-4 font-semibold">Status SLA</th>
              <th className="px-5 py-4 font-semibold">Batas Verifikasi</th>
              <th className="px-5 py-4 font-semibold">Batas Penyelesaian</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {reports.map((report) => (
              <tr
                key={report.id}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="px-5 py-4">
                  <div className="max-w-xs">
                    <p className="truncate font-semibold text-foreground">
                      {report.title}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.report_number} - {getRelationName(report.category)}
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {getRelationName(report.hamlet)}
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
                  <SlaBadge value={report.sla_status} />
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {report.verification_due_at
                    ? formatDateTime(report.verification_due_at)
                    : "-"}
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {report.resolution_due_at
                    ? formatDateTime(report.resolution_due_at)
                    : "-"}
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
              </div>

              <SlaBadge value={report.sla_status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="Dusun" value={getRelationName(report.hamlet)} />
              <InfoItem
                label="Prioritas"
                value={REPORT_PRIORITY_LABELS[report.priority] ?? report.priority}
              />
              <InfoItem
                label="Batas Verifikasi"
                value={
                  report.verification_due_at
                    ? formatDateTime(report.verification_due_at)
                    : "-"
                }
              />
              <InfoItem
                label="Batas Penyelesaian"
                value={
                  report.resolution_due_at
                    ? formatDateTime(report.resolution_due_at)
                    : "-"
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlaBadge({ value }: { value: string | null }) {
  if (!value) {
    return <Badge variant="muted">Belum Diatur</Badge>;
  }

  if (value === "on_time") {
    return <Badge className="bg-success-50 text-success-700">Tepat Waktu</Badge>;
  }

  if (value === "at_risk") {
    return (
      <Badge className="bg-warning-50 text-warning-700">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Berisiko
      </Badge>
    );
  }

  if (value === "critical") {
    return (
      <Badge className="bg-critical-50 text-critical-700">
        <AlertOctagon className="mr-1 h-3 w-3" />
        Kritis
      </Badge>
    );
  }

  if (value === "overdue") {
    return (
      <Badge className="bg-danger-50 text-danger-700">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Terlambat
      </Badge>
    );
  }

  if (value === "completed") {
    return <Badge className="bg-info-50 text-info-700">Selesai</Badge>;
  }

  if (value === "paused_budget") {
    return (
      <Badge className="bg-warning-50 text-warning-700">
        <PauseCircle className="mr-1 h-3 w-3" />
        Jeda Anggaran
      </Badge>
    );
  }

  if (value === "merged") {
    return (
      <Badge className="bg-slate-100 text-slate-700">
        <GitMerge className="mr-1 h-3 w-3" />
        Digabung
      </Badge>
    );
  }

  return <Badge variant="muted">{formatEnum(value)}</Badge>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

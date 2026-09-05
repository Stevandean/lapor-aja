"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ClipboardList, Search, X } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { SlaStatusBadge } from "@/src/features/reports/components/SlaStatusBadge";
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

export type KasiReportListItem = {
  id: string;
  report_number: string;
  title: string;
  description?: string;
  status: keyof typeof REPORT_STATUS_LABELS;
  priority: keyof typeof REPORT_PRIORITY_LABELS;
  follow_up_type: string;
  created_at: string;
  updated_at: string;
  resolution_due_at?: string | null;
  resolved_at?: string | null;
  sla_status?: string | null;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
  reporter: ReporterProfile[] | ReporterProfile | null;
};

type KasiReportTableProps = {
  reports: KasiReportListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  openSwadayaCampaignReportIds?: string[];
};

export function KasiReportTable({
  reports,
  emptyTitle = "Belum ada laporan ditugaskan",
  emptyDescription = "Laporan yang ditugaskan ke seksi Anda akan muncul di sini.",
  openSwadayaCampaignReportIds = [],
}: KasiReportTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");

  const categoryOptions = useMemo(
    () => uniqueValues(reports.map((report) => getRelationName(report.category))),
    [reports]
  );
  const slaOptions = useMemo(
    () =>
      uniqueValues(
        reports
          .map((report) => report.sla_status)
          .filter((value): value is string => Boolean(value))
      ),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const categoryName = getRelationName(report.category);
      const reporter = getReporter(report.reporter);
      const hamletName = getRelationName(report.hamlet).toLowerCase();

      const matchesSearch =
        !query ||
        report.title.toLowerCase().includes(query) ||
        report.report_number.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query) ||
        hamletName.includes(query) ||
        (reporter?.full_name ?? "").toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || categoryName === categoryFilter;
      const matchesSla =
        slaFilter === "all" || (report.sla_status ?? "") === slaFilter;

      return matchesSearch && matchesCategory && matchesSla;
    });
  }, [categoryFilter, reports, searchQuery, slaFilter]);

  const hasActiveFilters =
    searchQuery || categoryFilter !== "all" || slaFilter !== "all";

  function resetFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setSlaFilter("all");
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <ClipboardList className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          {emptyTitle}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_repeat(2,minmax(0,1fr))]">
          <div>
            <label className="form-label" htmlFor="kasi-report-search">
              Cari Laporan
            </label>
            <div className="relative">
              <Input
                id="kasi-report-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nomor, judul, dusun, atau pelapor"
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <Select
            label="Kategori"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">Semua kategori</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>

          <Select
            label="Status SLA"
            value={slaFilter}
            onChange={(event) => setSlaFilter(event.target.value)}
          >
            <option value="all">Semua status SLA</option>
            {slaOptions.map((sla) => (
              <option key={sla} value={sla}>
                {formatSlaLabel(sla)}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            Menampilkan{" "}
            <span className="font-semibold text-foreground">
              {filteredReports.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-foreground">
              {reports.length}
            </span>{" "}
            laporan
          </p>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Atur Ulang Saringan
            </Button>
          ) : null}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Tidak ada laporan yang cocok
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Coba ubah kata kunci atau filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Laporan</th>
                  <th className="px-5 py-4 font-semibold">Pelapor</th>
                  <th className="px-5 py-4 font-semibold">Dusun</th>
                  <th className="px-5 py-4 font-semibold">Prioritas</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Status SLA</th>
                  <th className="px-5 py-4 font-semibold">Diperbarui</th>
                  <th className="px-5 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredReports.map((report) => {
                  const reporter = getReporter(report.reporter);

                  return (
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
                            {report.report_number}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {reporter?.full_name ?? "-"}
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {getRelationName(report.hamlet)}
                      </td>

                      <td className="px-5 py-4">
                        <Badge variant="muted">
                          {REPORT_PRIORITY_LABELS[report.priority] ??
                            report.priority}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge className={getStatusBadgeClass(report.status)}>
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
                        {formatDate(report.updated_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/dashboard/kasi/reports/${report.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
                        >
                          Lihat detail
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {filteredReports.map((report) => {
              const reporter = getReporter(report.reporter);

              return (
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

                    <SlaStatusBadge
                      value={report.sla_status ?? null}
                      hasActiveSwadayaCampaign={openSwadayaCampaignReportIds.includes(
                        report.id
                      )}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={getStatusBadgeClass(report.status)}>
                      {REPORT_STATUS_LABELS[report.status] ?? report.status}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <InfoItem label="Pelapor" value={reporter?.full_name ?? "-"} />
                    <InfoItem label="Dusun" value={getRelationName(report.hamlet)} />
                    <InfoItem
                      label="Prioritas"
                      value={
                        REPORT_PRIORITY_LABELS[report.priority] ?? report.priority
                      }
                    />
                    <InfoItem label="Diperbarui" value={formatDate(report.updated_at)} />
                  </div>

                  <Link
                    href={`/dashboard/kasi/reports/${report.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
                  >
                    Lihat detail
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatSlaLabel(value: string) {
  const labels: Record<string, string> = {
    on_time: "Tepat Waktu",
    at_risk: "Berisiko",
    critical: "Kritis",
    overdue: "Terlambat",
    completed: "Selesai",
    paused_budget: "Jeda Anggaran",
    merged: "Digabung",
    not_set: "Belum Diatur",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values)).sort();
}

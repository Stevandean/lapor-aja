"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import {
  SlaEmptyState,
  SlaStatusBadge,
} from "@/src/features/reports/components/SlaStatusBadge";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

type Section = {
  id: string;
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
  section?: Section | null;
};

type VillageSlaTableProps = {
  reports: SlaReport[];
};

export function VillageSlaTable({ reports }: VillageSlaTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dusunFilter, setDusunFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const dusunOptions = useMemo(
    () => uniqueValues(reports.map((report) => getRelationName(report.hamlet))),
    [reports]
  );
  const categoryOptions = useMemo(
    () => uniqueValues(reports.map((report) => getRelationName(report.category))),
    [reports]
  );
  const sectionOptions = useMemo(() => {
    const seen = new Map<string, string>();

    for (const report of reports) {
      if (report.section) {
        seen.set(report.section.id, report.section.name);
      }
    }

    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [reports]);

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const hamletName = getRelationName(report.hamlet);
      const categoryName = getRelationName(report.category);

      const matchesSearch =
        !query ||
        report.title.toLowerCase().includes(query) ||
        report.report_number.toLowerCase().includes(query) ||
        hamletName.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query);

      const matchesDusun = dusunFilter === "all" || hamletName === dusunFilter;
      const matchesCategory =
        categoryFilter === "all" || categoryName === categoryFilter;
      const matchesSection =
        sectionFilter === "all" || report.section?.id === sectionFilter;

      return matchesSearch && matchesDusun && matchesCategory && matchesSection;
    });
  }, [categoryFilter, dusunFilter, reports, searchQuery, sectionFilter]);

  const hasActiveFilters =
    searchQuery ||
    dusunFilter !== "all" ||
    categoryFilter !== "all" ||
    sectionFilter !== "all";

  function resetFilters() {
    setSearchQuery("");
    setDusunFilter("all");
    setCategoryFilter("all");
    setSectionFilter("all");
  }

  if (reports.length === 0) {
    return <SlaEmptyState />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
          <div>
            <label className="form-label" htmlFor="village-sla-search">
              Cari Laporan
            </label>
            <div className="relative">
              <Input
                id="village-sla-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nomor, judul, dusun, atau kategori"
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <Select
            label="Dusun"
            value={dusunFilter}
            onChange={(event) => setDusunFilter(event.target.value)}
          >
            <option value="all">Semua dusun</option>
            {dusunOptions.map((dusun) => (
              <option key={dusun} value={dusun}>
                {dusun}
              </option>
            ))}
          </Select>

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
            label="Seksi"
            value={sectionFilter}
            onChange={(event) => setSectionFilter(event.target.value)}
          >
            <option value="all">Semua seksi</option>
            {sectionOptions.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
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
                {filteredReports.map((report) => (
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
                      <SlaStatusBadge value={report.sla_status} />
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
            {filteredReports.map((report) => (
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

                  <SlaStatusBadge value={report.sla_status} />
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

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values)).sort();
}

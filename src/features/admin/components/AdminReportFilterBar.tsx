"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Select } from "@/src/components/ui/Select";

type Option = {
  id: string;
  name: string;
};

const SLA_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "on_time", label: "Tepat Waktu" },
  { value: "at_risk", label: "Berisiko" },
  { value: "critical", label: "Kritis" },
  { value: "overdue", label: "Terlambat" },
  { value: "completed", label: "Selesai" },
  { value: "paused_budget", label: "Jeda Anggaran" },
  { value: "merged", label: "Digabung" },
  { value: "not_set", label: "Belum Diatur" },
];

type AdminReportFilterBarProps = {
  categories: Option[];
  dusuns: Option[];
  sections: Option[];
};

export function AdminReportFilterBar({
  categories,
  dusuns,
  sections,
}: AdminReportFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dusunValue = searchParams.get("dusun") ?? "all";
  const kategoriValue = searchParams.get("kategori") ?? "all";
  const seksiValue = searchParams.get("seksi") ?? "all";
  const slaValue = searchParams.get("sla") ?? "all";

  const hasActiveFilters =
    dusunValue !== "all" ||
    kategoriValue !== "all" ||
    seksiValue !== "all" ||
    slaValue !== "all";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const queryString = params.toString();
    router.push(
      queryString ? `/dashboard/admin/reports?${queryString}` : "/dashboard/admin/reports"
    );
  }

  function resetFilters() {
    router.push("/dashboard/admin/reports");
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Dusun"
          value={dusunValue}
          onChange={(event) => updateFilter("dusun", event.target.value)}
        >
          <option value="all">Semua dusun</option>
          {dusuns.map((dusun) => (
            <option key={dusun.id} value={dusun.id}>
              {dusun.name}
            </option>
          ))}
        </Select>

        <Select
          label="Kategori"
          value={kategoriValue}
          onChange={(event) => updateFilter("kategori", event.target.value)}
        >
          <option value="all">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Select
          label="Seksi"
          value={seksiValue}
          onChange={(event) => updateFilter("seksi", event.target.value)}
        >
          <option value="all">Semua seksi</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </Select>

        <Select
          label="Status SLA"
          value={slaValue}
          onChange={(event) => updateFilter("sla", event.target.value)}
        >
          <option value="all">Semua status SLA</option>
          {SLA_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
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

        <a href={`/api/exports/reports?${searchParams.toString()}`}>
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Ekspor CSV
          </Button>
        </a>
      </div>
    </div>
  );
}

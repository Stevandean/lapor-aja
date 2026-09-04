"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Select } from "@/src/components/ui/Select";
import type { PerformancePeriodType } from "@/src/lib/performancePeriod";

type PeriodOption = {
  offset: number;
  label: string;
};

type VillagePerformanceFilterBarProps = {
  periodOptions: PeriodOption[];
};

const DEFAULT_PERIOD_TYPE: PerformancePeriodType = "bulanan";
const DEFAULT_OFFSET = 1;

export function VillagePerformanceFilterBar({
  periodOptions,
}: VillagePerformanceFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const periodType =
    (searchParams.get("tipe") as PerformancePeriodType | null) ?? DEFAULT_PERIOD_TYPE;
  const offsetParam = searchParams.get("periode");
  const offset = offsetParam !== null ? Number(offsetParam) : DEFAULT_OFFSET;

  const hasActiveFilters = periodType !== DEFAULT_PERIOD_TYPE || offset !== DEFAULT_OFFSET;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);

    if (key === "tipe") {
      params.delete("periode");
    }

    router.push(`/dashboard/village/performance?${params.toString()}`);
  }

  function resetFilters() {
    router.push("/dashboard/village/performance");
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <Select
          label="Jenis Periode"
          value={periodType}
          onChange={(event) => updateParam("tipe", event.target.value)}
        >
          <option value="bulanan">Bulanan</option>
          <option value="triwulanan">Triwulanan</option>
        </Select>

        <Select
          label="Periode"
          value={String(offset)}
          onChange={(event) => updateParam("periode", event.target.value)}
        >
          {periodOptions.map((option) => (
            <option key={option.offset} value={option.offset}>
              {option.label}
              {option.offset === 0 ? " (berjalan)" : ""}
            </option>
          ))}
        </Select>

        {hasActiveFilters ? (
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Atur Ulang
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

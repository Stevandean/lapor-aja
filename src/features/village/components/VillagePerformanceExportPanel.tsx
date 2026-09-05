"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

export function VillagePerformanceExportPanel() {
  const searchParams = useSearchParams();
  const [includeDemo, setIncludeDemo] = useState(false);

  const periodType = searchParams.get("tipe") ?? "bulanan";
  const periodOffset = searchParams.get("periode") ?? "1";
  const demoParam = includeDemo ? "1" : "0";

  const pdfHref = `/api/exports/performance/pdf?tipe=${periodType}&periode=${periodOffset}&demo=${demoParam}`;
  const excelHref = `/api/exports/performance/excel?tipe=${periodType}&periode=${periodOffset}&demo=${demoParam}`;

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={includeDemo}
            onChange={(event) => setIncludeDemo(event.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Sertakan data contoh (demo) dalam ekspor
        </label>

        <div className="flex flex-wrap gap-3">
          <a href={pdfHref}>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Unduh PDF
            </Button>
          </a>

          <a href={excelHref}>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Unduh Excel
            </Button>
          </a>
        </div>
      </div>

      {includeDemo ? (
        <p className="mt-3 text-xs text-warning-700">
          Ekspor akan menyertakan laporan data contoh (demo) — angka tidak
          mencerminkan kondisi nyata desa.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Ekspor hanya berisi laporan sungguhan (data contoh dikecualikan).
        </p>
      )}
    </div>
  );
}

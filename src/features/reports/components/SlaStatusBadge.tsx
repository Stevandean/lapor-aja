import {
  AlertOctagon,
  AlertTriangle,
  ClipboardList,
  GitMerge,
  PauseCircle,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";

// Cabang 2b: diekstrak dari VillageSlaTable.tsx supaya bisa dipakai ulang
// di halaman watchlist Kasi dan Admin, bukan cuma sisi Kepala Desa/Sekdes.
// Logika warna/label PERSIS sama, tidak diubah.
export function SlaStatusBadge({ value }: { value: string | null }) {
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

export function SlaEmptyState({
  title = "Belum ada laporan SLA",
  description = "Data monitoring SLA akan muncul setelah laporan dikirim dan diproses.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
        <ClipboardList className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>

      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

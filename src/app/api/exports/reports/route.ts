import { NextResponse } from "next/server";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getAdminReports } from "@/src/features/admin/queries";

const SLA_LABELS: Record<string, string> = {
  on_time: "Tepat Waktu",
  at_risk: "Berisiko",
  critical: "Kritis",
  overdue: "Terlambat",
  completed: "Selesai",
  paused_budget: "Jeda Anggaran",
  merged: "Digabung",
  not_set: "Belum Diatur",
};

function toCsvField(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Tidak terotorisasi." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const reports = await getAdminReports({
    dusunId: searchParams.get("dusun") ?? undefined,
    categoryId: searchParams.get("kategori") ?? undefined,
    sectionId: searchParams.get("seksi") ?? undefined,
    slaStatus: searchParams.get("sla") ?? undefined,
  });

  const header = [
    "Nomor Laporan",
    "Judul",
    "Kategori",
    "Dusun",
    "Seksi",
    "Prioritas",
    "Status",
    "Status SLA",
    "Dibuat",
    "Batas Penyelesaian",
  ];

  const rows = reports.map((report) =>
    [
      report.report_number,
      report.title,
      report.categories?.[0]?.name ?? "",
      report.dusuns?.[0]?.name ?? "",
      report.section?.name ?? "",
      report.priority,
      report.status,
      SLA_LABELS[report.sla_status] ?? report.sla_status,
      report.created_at,
      report.resolution_due_at ?? "",
    ]
      .map(toCsvField)
      .join(",")
  );

  const csv = [header.map(toCsvField).join(","), ...rows].join("\r\n");
  const bom = "﻿"; // supaya Excel baca UTF-8 (nama dusun/kategori) dengan benar

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-${Date.now()}.csv"`,
    },
  });
}

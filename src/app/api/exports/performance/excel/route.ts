import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getPerformanceExportData } from "@/src/features/village/queries";
import type { PerformancePeriodType } from "@/src/lib/performancePeriod";

const PRIORITY_LABELS: Record<string, string> = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
  darurat: "Darurat",
};

export async function GET(request: Request) {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return NextResponse.json({ error: "Tidak terotorisasi." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodType: PerformancePeriodType =
    searchParams.get("tipe") === "triwulanan" ? "triwulanan" : "bulanan";
  const periodOffset = Number(searchParams.get("periode") ?? 1);
  const includeDemo = searchParams.get("demo") === "1";

  const data = await getPerformanceExportData({
    periodType,
    periodOffset: Number.isFinite(periodOffset) ? periodOffset : 1,
    includeDemo,
  });

  if (!data) {
    return NextResponse.json({ error: "Tidak terotorisasi." }, { status: 401 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistem Lapor Aja";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [{ width: 28 }, { width: 40 }];

  summarySheet.addRow(["Evaluasi Kinerja Penanganan Laporan"]).font = { bold: true, size: 14 };
  summarySheet.addRow([`Periode: ${data.period.label}`]);
  summarySheet.addRow([
    data.includeDemo
      ? "Termasuk data contoh (demo)"
      : "Tidak termasuk data contoh (demo) — murni laporan sungguhan",
  ]);
  summarySheet.addRow([]);
  summarySheet.addRow(["Total Laporan Selesai", data.summary.totalReports]);
  summarySheet.addRow(["Tepat Waktu", data.summary.onTimeReports]);
  summarySheet.addRow(["Terlambat", data.summary.lateReports]);
  summarySheet.addRow(["% Tepat Waktu", `${Math.round(data.summary.onTimePercentage)}%`]);
  summarySheet.addRow(["Rata-rata Jam Penyelesaian", data.summary.avgResolutionHours.toFixed(1)]);
  summarySheet.addRow([]);

  addGroupTable(summarySheet, "Performa per Seksi", data.bySection);
  summarySheet.addRow([]);
  addGroupTable(summarySheet, "Performa per Kategori", data.byCategory);

  const detailSheet = workbook.addWorksheet("Detail Laporan");
  detailSheet.columns = [
    { header: "Nomor Laporan", key: "reportNumber", width: 20 },
    { header: "Judul", key: "title", width: 36 },
    { header: "Kategori", key: "categoryName", width: 22 },
    { header: "Dusun", key: "dusunName", width: 18 },
    { header: "Seksi", key: "sectionName", width: 22 },
    { header: "Prioritas", key: "priority", width: 12 },
    { header: "Dibuat", key: "createdAt", width: 20 },
    { header: "Selesai", key: "resolvedAt", width: 20 },
    { header: "Batas Penyelesaian", key: "resolutionDueAt", width: 20 },
    { header: "Status", key: "status", width: 14 },
    { header: "Data Contoh", key: "isDemoData", width: 14 },
  ];
  detailSheet.getRow(1).font = { bold: true };

  for (const row of data.rows) {
    detailSheet.addRow({
      reportNumber: row.reportNumber,
      title: row.title,
      categoryName: row.categoryName ?? "-",
      dusunName: row.dusunName ?? "-",
      sectionName: row.sectionName ?? "-",
      priority: PRIORITY_LABELS[row.priority] ?? row.priority,
      createdAt: formatDateTime(row.createdAt),
      resolvedAt: formatDateTime(row.resolvedAt),
      resolutionDueAt: row.resolutionDueAt ? formatDateTime(row.resolutionDueAt) : "-",
      status: row.isOnTime ? "Tepat Waktu" : "Terlambat",
      isDemoData: row.isDemoData ? "Ya" : "Tidak",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="evaluasi-kinerja-${data.period.label.replaceAll(" ", "-")}.xlsx"`,
    },
  });
}

function addGroupTable(
  sheet: ExcelJS.Worksheet,
  title: string,
  groups: {
    name: string;
    totalReports: number;
    onTimeReports: number;
    lateReports: number;
    onTimePercentage: number;
    avgResolutionHours: number;
  }[]
) {
  sheet.addRow([title]).font = { bold: true };
  sheet.addRow([
    "Nama",
    "Total",
    "Tepat Waktu",
    "Terlambat",
    "% Tepat Waktu",
    "Rata-rata Jam",
  ]).font = { bold: true };

  if (groups.length === 0) {
    sheet.addRow(["Belum ada data laporan selesai pada periode ini."]);
    return;
  }

  for (const group of groups) {
    sheet.addRow([
      group.name,
      group.totalReports,
      group.onTimeReports,
      group.lateReports,
      `${Math.round(group.onTimePercentage)}%`,
      group.avgResolutionHours.toFixed(1),
    ]);
  }
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

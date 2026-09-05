import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getPerformanceExportData } from "@/src/features/village/queries";
import { buildPerformancePdfHtml } from "@/src/features/village/performanceExport";
import type { PerformancePeriodType } from "@/src/lib/performancePeriod";

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

  const html = buildPerformancePdfHtml({
    periodLabel: data.period.label,
    includeDemo: data.includeDemo,
    summary: data.summary,
    bySection: data.bySection,
    byCategory: data.byCategory,
    generatedAt: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
  });

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="evaluasi-kinerja-${data.period.label.replaceAll(" ", "-")}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}

import { prisma } from "@/src/lib/prisma";

// Cabang 4c: statistik publik, TIDAK gerbang login (tidak ada getProfile()
// di sini sama sekali — halaman ini murni anonim, lihat rasionalisasi di
// CLAUDE.md soal kenapa "terbuka" berarti tanpa akun, bukan cuma role
// public yang tetap wajib login). SELALU mengecualikan isDemoData=true,
// TIDAK ADA toggle untuk publik (beda dari ekspor internal 4b).
export async function getPublicSlaComplianceStats() {
  const reports = await prisma.report.findMany({
    where: {
      status: "resolved",
      isDemoData: false,
      resolvedAt: { not: null },
    },
    select: {
      resolvedAt: true,
      resolutionDueAt: true,
      category: { select: { id: true, name: true } },
    },
  });

  let onTimeReports = 0;
  const byCategory = new Map<
    string,
    { name: string; totalReports: number; onTimeReports: number }
  >();

  for (const report of reports) {
    const isOnTime =
      !report.resolutionDueAt ||
      report.resolvedAt!.getTime() <= report.resolutionDueAt.getTime();

    if (isOnTime) {
      onTimeReports += 1;
    }

    const categoryId = report.category?.id ?? "tanpa-kategori";
    const categoryName = report.category?.name ?? "Tanpa Kategori";
    const existing = byCategory.get(categoryId);

    if (existing) {
      existing.totalReports += 1;
      if (isOnTime) existing.onTimeReports += 1;
    } else {
      byCategory.set(categoryId, {
        name: categoryName,
        totalReports: 1,
        onTimeReports: isOnTime ? 1 : 0,
      });
    }
  }

  const totalReports = reports.length;

  return {
    totalReports,
    onTimeReports,
    onTimePercentage: totalReports > 0 ? (onTimeReports / totalReports) * 100 : 0,
    byCategory: Array.from(byCategory.values())
      .map((category) => ({
        ...category,
        onTimePercentage:
          category.totalReports > 0
            ? (category.onTimeReports / category.totalReports) * 100
            : 0,
      }))
      .sort((a, b) => b.totalReports - a.totalReports),
  };
}

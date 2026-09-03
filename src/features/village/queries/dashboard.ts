import { getProfile } from "@/src/lib/auth/getProfile";
import { prisma } from "@/src/lib/prisma";
import type { ReportStatus } from "@prisma/client";

export async function getVillageDashboardData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      stats: {
        totalReports: 0,
        pendingReports: 0,
        needVerificationReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
        archivedReports: 0,
      },
      recentReports: [],
    };
  }

  const countByStatus = async (status?: ReportStatus) =>
    prisma.report.count({ where: status ? { status } : undefined });

  const [
    totalReports,
    pendingReports,
    needVerificationReports,
    inProgressReports,
    resolvedReports,
    archivedReports,
    recentReports,
  ] = await Promise.all([
    countByStatus(),
    countByStatus("pending"),
    countByStatus("need_verification"),
    countByStatus("in_progress"),
    countByStatus("resolved"),
    countByStatus("archived"),
    prisma.report.findMany({
      select: {
        id: true,
        reportNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        dusun: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  return {
    stats: {
      totalReports,
      pendingReports,
      needVerificationReports,
      inProgressReports,
      resolvedReports,
      archivedReports,
    },
    recentReports: recentReports.map((report) => ({
      id: report.id,
      report_number: report.reportNumber,
      title: report.title,
      status: report.status,
      priority: report.priority,
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
      category: report.category,
      hamlet: report.dusun,
    })),
  };
}

function countByValue(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getVillageAnalyticsData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      totalReports: 0,
      statusStats: [],
      priorityStats: [],
      categoryStats: [],
      hamletStats: [],
    };
  }

  const reports = await prisma.report.findMany({
    select: {
      id: true,
      status: true,
      priority: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
    },
  });

  return {
    totalReports: reports.length,
    statusStats: countByValue(reports.map((report) => report.status)),
    priorityStats: countByValue(reports.map((report) => report.priority)),
    categoryStats: countByValue(
      reports.map((report) => report.category?.name ?? "Uncategorized")
    ),
    hamletStats: countByValue(
      reports.map((report) => report.dusun?.name ?? "Uncategorized")
    ),
  };
}

import { prisma } from "@/src/lib/prisma";
import type { ReportStatus } from "@prisma/client";
import { isEffectiveSlaOverdue } from "@/src/lib/sla";

async function getReportCount(status?: ReportStatus) {
  return prisma.report.count({ where: status ? { status } : undefined });
}

async function getEffectiveOverdueReportCount() {
  const reports = await prisma.report.findMany({
    select: {
      status: true,
      createdAt: true,
      resolutionDueAt: true,
      resolvedAt: true,
    },
  });

  return reports.filter((report) =>
    isEffectiveSlaOverdue({
      status: report.status,
      created_at: report.createdAt.toISOString(),
      resolution_due_at: report.resolutionDueAt?.toISOString() ?? null,
      resolved_at: report.resolvedAt?.toISOString() ?? null,
    })
  ).length;
}

export async function getAdminDashboardStats() {
  const [
    totalReports,
    pendingReports,
    needVerificationReports,
    inProgressReports,
    resolvedReports,
    overdueReports,
  ] = await Promise.all([
    getReportCount(),
    getReportCount("pending"),
    getReportCount("need_verification"),
    getReportCount("in_progress"),
    getReportCount("resolved"),
    getEffectiveOverdueReportCount(),
  ]);

  return {
    totalReports,
    pendingReports,
    needVerificationReports,
    inProgressReports,
    resolvedReports,
    overdueReports,
  };
}

export async function getRecentReports() {
  const reports = await prisma.report.findMany({
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return reports.map((report) => ({
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    priority: report.priority,
    created_at: report.createdAt.toISOString(),
  }));
}

import { prisma } from "@/src/lib/prisma";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

export type PublicSlaCategoryStat = {
  id: string;
  name: string;
  totalReports: number;
  onTimeReports: number;
  lateReports: number;
  onTimePercentage: number;
  averageDays: number;
};

export type PublicSlaPriorityStat = {
  priority: string;
  label: string;
  verificationHours: number;
  resolutionHours: number;
  totalReports: number;
  onTimeReports: number;
  onTimePercentage: number;
};

export type PublicSlaStandard = {
  priority: string;
  label: string;
  verificationHours: number;
  resolutionHours: number;
  description: string | null;
};

export type PublicSlaComplianceStats = {
  totalReports: number;
  onTimeReports: number;
  lateReports: number;
  onTimePercentage: number;
  averageResolutionDays: number;
  isUsingDemoFallback: boolean;
  byCategory: PublicSlaCategoryStat[];
  byPriority: PublicSlaPriorityStat[];
  standards: PublicSlaStandard[];
};

type GetPublicSlaOptions = {
  includeDemo?: boolean;
};

export async function getPublicSlaComplianceStats(
  options?: GetPublicSlaOptions
): Promise<PublicSlaComplianceStats> {
  const slaRules = await prisma.slaRule.findMany({
    where: { isActive: true },
    select: {
      priority: true,
      verificationHours: true,
      resolutionHours: true,
      description: true,
    },
    orderBy: { priority: "asc" },
  });

  const standards: PublicSlaStandard[] = slaRules.map((rule) => ({
    priority: rule.priority,
    label:
      REPORT_PRIORITY_LABELS[
      rule.priority as keyof typeof REPORT_PRIORITY_LABELS
      ] ?? rule.priority,
    verificationHours: rule.verificationHours,
    resolutionHours: rule.resolutionHours,
    description: rule.description,
  }));

  let isUsingDemoFallback = false;
  let reports = await prisma.report.findMany({
    where: {
      status: "resolved",
      isDemoData: false,
      resolvedAt: { not: null },
    },
    select: {
      createdAt: true,
      resolvedAt: true,
      resolutionDueAt: true,
      priority: true,
      category: { select: { id: true, name: true } },
    },
  });

  // Jika data non-demo belum ada (misal di masa awal instalasi / testing),
  // atau parameter eksplisit meminta simulasi, gunakan data yang ada dengan transparansi
  if (reports.length === 0 || options?.includeDemo) {
    isUsingDemoFallback = true;
    reports = await prisma.report.findMany({
      where: {
        status: "resolved",
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
        resolutionDueAt: true,
        priority: true,
        category: { select: { id: true, name: true } },
      },
    });
  }

  let onTimeReports = 0;
  let totalResolutionHours = 0;
  let validDurationCount = 0;

  const byCategory = new Map<
    string,
    {
      id: string;
      name: string;
      totalReports: number;
      onTimeReports: number;
      totalHours: number;
    }
  >();

  const byPriorityMap = new Map<
    string,
    { totalReports: number; onTimeReports: number }
  >();

  for (const report of reports) {
    const isOnTime =
      !report.resolutionDueAt ||
      report.resolvedAt!.getTime() <= report.resolutionDueAt.getTime();

    if (isOnTime) {
      onTimeReports += 1;
    }

    if (report.resolvedAt && report.createdAt) {
      const diffHours =
        (report.resolvedAt.getTime() - report.createdAt.getTime()) /
        (1000 * 60 * 60);
      if (diffHours >= 0) {
        totalResolutionHours += diffHours;
        validDurationCount += 1;
      }
    }

    // Agregasi Kategori
    const categoryId = report.category?.id ?? "tanpa-kategori";
    const categoryName = report.category?.name ?? "Tanpa Kategori";
    const durationHours =
      report.resolvedAt && report.createdAt
        ? Math.max(
          0,
          (report.resolvedAt.getTime() - report.createdAt.getTime()) /
          (1000 * 60 * 60)
        )
        : 0;

    const existingCat = byCategory.get(categoryId);
    if (existingCat) {
      existingCat.totalReports += 1;
      if (isOnTime) existingCat.onTimeReports += 1;
      existingCat.totalHours += durationHours;
    } else {
      byCategory.set(categoryId, {
        id: categoryId,
        name: categoryName,
        totalReports: 1,
        onTimeReports: isOnTime ? 1 : 0,
        totalHours: durationHours,
      });
    }

    // Agregasi Prioritas
    const prioKey = report.priority;
    const existingPrio = byPriorityMap.get(prioKey);
    if (existingPrio) {
      existingPrio.totalReports += 1;
      if (isOnTime) existingPrio.onTimeReports += 1;
    } else {
      byPriorityMap.set(prioKey, {
        totalReports: 1,
        onTimeReports: isOnTime ? 1 : 0,
      });
    }
  }

  const totalReports = reports.length;
  const lateReports = totalReports - onTimeReports;
  const onTimePercentage =
    totalReports > 0 ? (onTimeReports / totalReports) * 100 : 0;
  const averageResolutionHours =
    validDurationCount > 0 ? totalResolutionHours / validDurationCount : 0;
  const averageResolutionDays =
    Math.round((averageResolutionHours / 24) * 10) / 10;

  const categoryStats: PublicSlaCategoryStat[] = Array.from(
    byCategory.values()
  )
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      totalReports: cat.totalReports,
      onTimeReports: cat.onTimeReports,
      lateReports: cat.totalReports - cat.onTimeReports,
      onTimePercentage:
        cat.totalReports > 0 ? (cat.onTimeReports / cat.totalReports) * 100 : 0,
      averageDays:
        cat.totalReports > 0
          ? Math.round((cat.totalHours / cat.totalReports / 24) * 10) / 10
          : 0,
    }))
    .sort((a, b) => b.totalReports - a.totalReports);

  const priorityStats: PublicSlaPriorityStat[] = standards.map((std) => {
    const data = byPriorityMap.get(std.priority) ?? {
      totalReports: 0,
      onTimeReports: 0,
    };
    return {
      priority: std.priority,
      label: std.label,
      verificationHours: std.verificationHours,
      resolutionHours: std.resolutionHours,
      totalReports: data.totalReports,
      onTimeReports: data.onTimeReports,
      onTimePercentage:
        data.totalReports > 0
          ? (data.onTimeReports / data.totalReports) * 100
          : 0,
    };
  });

  return {
    totalReports,
    onTimeReports,
    lateReports,
    onTimePercentage,
    averageResolutionDays,
    isUsingDemoFallback,
    byCategory: categoryStats,
    byPriority: priorityStats,
    standards,
  };
}

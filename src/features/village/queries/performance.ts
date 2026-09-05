import { getProfile } from "@/src/lib/auth/getProfile";
import { prisma } from "@/src/lib/prisma";
import {
  getPeriodRange,
  getPeriodWindow,
  PERFORMANCE_TREND_LENGTH,
  type PerformancePeriodType,
} from "@/src/lib/performancePeriod";

const HOUR_MS = 60 * 60 * 1000;

type ResolvedReportRow = {
  createdAt: Date;
  resolvedAt: Date;
  resolutionDueAt: Date | null;
  assignedSectionId: string | null;
  assignedSection: { id: string; name: string } | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
};

type PeriodSummary = {
  totalReports: number;
  onTimeReports: number;
  lateReports: number;
  onTimePercentage: number;
  avgResolutionHours: number;
};

type GroupSummary = {
  id: string;
  name: string;
} & PeriodSummary;

async function requireVillageLeaderProfile() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return null;
  }

  return profile;
}

function summarizeReports(reports: ResolvedReportRow[]): PeriodSummary {
  const totalReports = reports.length;
  let onTimeReports = 0;
  let totalResolutionHours = 0;

  for (const report of reports) {
    const isOnTime =
      !report.resolutionDueAt || report.resolvedAt.getTime() <= report.resolutionDueAt.getTime();

    if (isOnTime) {
      onTimeReports += 1;
    }

    totalResolutionHours +=
      (report.resolvedAt.getTime() - report.createdAt.getTime()) / HOUR_MS;
  }

  const lateReports = totalReports - onTimeReports;

  return {
    totalReports,
    onTimeReports,
    lateReports,
    onTimePercentage: totalReports > 0 ? (onTimeReports / totalReports) * 100 : 0,
    avgResolutionHours: totalReports > 0 ? totalResolutionHours / totalReports : 0,
  };
}

function groupBySection(reports: ResolvedReportRow[]): GroupSummary[] {
  const groups = new Map<string, { name: string; reports: ResolvedReportRow[] }>();

  for (const report of reports) {
    if (!report.assignedSection) continue;

    const existing = groups.get(report.assignedSection.id);
    if (existing) {
      existing.reports.push(report);
    } else {
      groups.set(report.assignedSection.id, {
        name: report.assignedSection.name,
        reports: [report],
      });
    }
  }

  return Array.from(groups.entries())
    .map(([id, group]) => ({
      id,
      name: group.name,
      ...summarizeReports(group.reports),
    }))
    .sort((a, b) => b.totalReports - a.totalReports);
}

function groupByCategory(reports: ResolvedReportRow[]): GroupSummary[] {
  const groups = new Map<string, { name: string; reports: ResolvedReportRow[] }>();

  for (const report of reports) {
    if (!report.category) continue;

    const existing = groups.get(report.category.id);
    if (existing) {
      existing.reports.push(report);
    } else {
      groups.set(report.category.id, {
        name: report.category.name,
        reports: [report],
      });
    }
  }

  return Array.from(groups.entries())
    .map(([id, group]) => ({
      id,
      name: group.name,
      ...summarizeReports(group.reports),
    }))
    .sort((a, b) => b.totalReports - a.totalReports);
}

const EMPTY_PERFORMANCE_DATA = {
  periodType: "bulanan" as PerformancePeriodType,
  selectedPeriod: null,
  summary: { totalReports: 0, onTimeReports: 0, lateReports: 0, onTimePercentage: 0, avgResolutionHours: 0 },
  bySection: [] as GroupSummary[],
  byCategory: [] as GroupSummary[],
  trend: [] as { offset: number; label: string; summary: PeriodSummary }[],
};

export async function getVillagePerformanceData({
  periodType,
  periodOffset,
}: {
  periodType: PerformancePeriodType;
  periodOffset: number;
}) {
  const profile = await requireVillageLeaderProfile();

  if (!profile) {
    return EMPTY_PERFORMANCE_DATA;
  }

  const selectedPeriod = getPeriodRange(periodType, periodOffset);
  const trendLength = PERFORMANCE_TREND_LENGTH[periodType];
  const trendPeriods = getPeriodWindow(periodType, trendLength, periodOffset);

  const rangeStart = trendPeriods[0].start;
  const rangeEnd = trendPeriods[trendPeriods.length - 1].end;

  const reports = await prisma.report.findMany({
    where: {
      status: "resolved",
      resolvedAt: { gte: rangeStart, lte: rangeEnd },
    },
    select: {
      createdAt: true,
      resolvedAt: true,
      resolutionDueAt: true,
      assignedSectionId: true,
      assignedSection: { select: { id: true, name: true } },
      categoryId: true,
      category: { select: { id: true, name: true } },
    },
  });

  const resolvedReports = reports as ResolvedReportRow[];

  const selectedReports = resolvedReports.filter(
    (report) =>
      report.resolvedAt.getTime() >= selectedPeriod.start.getTime() &&
      report.resolvedAt.getTime() <= selectedPeriod.end.getTime()
  );

  const trend = trendPeriods.map((period) => {
    const periodReports = resolvedReports.filter(
      (report) =>
        report.resolvedAt.getTime() >= period.start.getTime() &&
        report.resolvedAt.getTime() <= period.end.getTime()
    );

    return {
      offset: period.offset,
      label: period.label,
      summary: summarizeReports(periodReports),
    };
  });

  return {
    periodType,
    selectedPeriod: {
      offset: selectedPeriod.offset,
      label: selectedPeriod.label,
      start: selectedPeriod.start.toISOString(),
      end: selectedPeriod.end.toISOString(),
    },
    summary: summarizeReports(selectedReports),
    bySection: groupBySection(selectedReports),
    byCategory: groupByCategory(selectedReports),
    trend,
  };
}

export type PerformancePredicateRecord = {
  id: string;
  periodType: PerformancePeriodType;
  periodStart: string;
  periodEnd: string;
  sectionName: string | null;
  totalReports: number;
  onTimeReports: number;
  lateReports: number;
  onTimePercentage: number;
  avgResolutionHours: number;
  badgeLabel: string | null;
  createdAt: string;
  generatedByName: string | null;
};

export async function getPerformancePredicateHistory(): Promise<
  PerformancePredicateRecord[]
> {
  const profile = await requireVillageLeaderProfile();

  if (!profile) {
    return [];
  }

  const snapshots = await prisma.performanceSnapshot.findMany({
    where: { scopeType: "seksi" },
    orderBy: { periodStart: "desc" },
    include: {
      section: { select: { name: true } },
      generatedByUser: { select: { fullName: true } },
    },
  });

  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    periodType: snapshot.periodType,
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
    sectionName: snapshot.section?.name ?? null,
    totalReports: snapshot.totalReports,
    onTimeReports: snapshot.onTimeReports,
    lateReports: snapshot.lateReports,
    onTimePercentage: Number(snapshot.onTimePercentage),
    avgResolutionHours: Number(snapshot.avgResolutionHours),
    badgeLabel: snapshot.badgeLabel,
    createdAt: snapshot.createdAt.toISOString(),
    generatedByName: snapshot.generatedByUser?.fullName ?? null,
  }));
}

export type PerformanceExportRow = {
  reportNumber: string;
  title: string;
  categoryName: string | null;
  dusunName: string | null;
  sectionName: string | null;
  priority: string;
  createdAt: string;
  resolvedAt: string;
  resolutionDueAt: string | null;
  isOnTime: boolean;
  isDemoData: boolean;
};

// Cabang 4b: dipakai KHUSUS oleh ekspor PDF/Excel, TIDAK oleh dashboard
// 3a/3b yang tetap seperti semula (selalu ikutkan semua laporan resolved,
// demo maupun asli — itu keputusan Cabang 3 yang tidak diubah di sini).
// `includeDemo=false` (default toggle ekspor) mengecualikan laporan
// `isDemoData=true` dari SELURUH angka (ringkasan, breakdown, DAN baris
// detail), bukan cuma disembunyikan dari tabel detail.
export async function getPerformanceExportData({
  periodType,
  periodOffset,
  includeDemo,
}: {
  periodType: PerformancePeriodType;
  periodOffset: number;
  includeDemo: boolean;
}) {
  const profile = await requireVillageLeaderProfile();

  if (!profile) {
    return null;
  }

  const period = getPeriodRange(periodType, periodOffset);

  const reports = await prisma.report.findMany({
    where: {
      status: "resolved",
      resolvedAt: { gte: period.start, lte: period.end },
      ...(includeDemo ? {} : { isDemoData: false }),
    },
    select: {
      reportNumber: true,
      title: true,
      priority: true,
      createdAt: true,
      resolvedAt: true,
      resolutionDueAt: true,
      isDemoData: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
      dusun: { select: { name: true } },
      assignedSectionId: true,
      assignedSection: { select: { id: true, name: true } },
    },
    orderBy: { resolvedAt: "asc" },
  });

  const resolvedRows: ResolvedReportRow[] = reports.map((report) => ({
    createdAt: report.createdAt,
    resolvedAt: report.resolvedAt as Date,
    resolutionDueAt: report.resolutionDueAt,
    assignedSectionId: report.assignedSectionId,
    assignedSection: report.assignedSection,
    categoryId: report.categoryId,
    category: report.category,
  }));

  const detailRows: PerformanceExportRow[] = reports.map((report) => ({
    reportNumber: report.reportNumber,
    title: report.title,
    categoryName: report.category?.name ?? null,
    dusunName: report.dusun?.name ?? null,
    sectionName: report.assignedSection?.name ?? null,
    priority: report.priority,
    createdAt: report.createdAt.toISOString(),
    resolvedAt: (report.resolvedAt as Date).toISOString(),
    resolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
    isOnTime:
      !report.resolutionDueAt ||
      (report.resolvedAt as Date).getTime() <= report.resolutionDueAt.getTime(),
    isDemoData: report.isDemoData,
  }));

  return {
    period: {
      label: period.label,
      start: period.start.toISOString(),
      end: period.end.toISOString(),
    },
    includeDemo,
    summary: summarizeReports(resolvedRows),
    bySection: groupBySection(resolvedRows),
    byCategory: groupByCategory(resolvedRows),
    rows: detailRows,
  };
}

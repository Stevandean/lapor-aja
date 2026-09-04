import { getProfile } from "@/src/lib/auth/getProfile";
import { calculateEffectiveSlaStatus } from "@/src/lib/sla";
import { prisma } from "@/src/lib/prisma";

const MAP_LIMIT = 200;

function countByValueWithFallback(values: (string | null)[], fallback = "not_set") {
  const counts = new Map<string, number>();

  for (const value of values) {
    const key = value || fallback;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getVillageSlaMonitoringData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      totalReports: 0,
      slaStats: [],
      reports: [],
    };
  }

  const reports = await prisma.report.findMany({
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      priority: true,
      slaStatus: true,
      verificationDueAt: true,
      resolutionDueAt: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
      assignedSection: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const mappedReports = reports.map((report) => {
    const createdAtIso = report.createdAt.toISOString();
    const resolutionDueAtIso = report.resolutionDueAt?.toISOString() ?? null;
    const resolvedAtIso = report.resolvedAt?.toISOString() ?? null;

    return {
      id: report.id,
      report_number: report.reportNumber,
      title: report.title,
      status: report.status,
      priority: report.priority,
      sla_status: calculateEffectiveSlaStatus({
        status: report.status,
        created_at: createdAtIso,
        resolution_due_at: resolutionDueAtIso,
        resolved_at: resolvedAtIso,
      }),
      verification_due_at: report.verificationDueAt?.toISOString() ?? null,
      resolution_due_at: resolutionDueAtIso,
      resolved_at: resolvedAtIso,
      created_at: createdAtIso,
      updated_at: report.updatedAt.toISOString(),
      category: report.category,
      hamlet: report.dusun,
      section: report.assignedSection,
    };
  });

  return {
    totalReports: mappedReports.length,
    slaStats: countByValueWithFallback(
      mappedReports.map((report) => report.sla_status)
    ),
    reports: mappedReports,
  };
}

export async function getVillageHeatmapReports() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return [];
  }

  const reports = await prisma.report.findMany({
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      priority: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: MAP_LIMIT,
  });

  return reports.map((report) => ({
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    priority: report.priority,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
    category: report.category,
    hamlet: report.dusun,
  }));
}

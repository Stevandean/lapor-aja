import { prisma } from "@/src/lib/prisma";

type ReportRelationSummary = {
  duplicateAsSource: number;
  duplicateAsTarget: number;
  recurrenceAsSource: number;
  recurrenceAsTarget: number;
};

function emptyRelationSummary(): ReportRelationSummary {
  return {
    duplicateAsSource: 0,
    duplicateAsTarget: 0,
    recurrenceAsSource: 0,
    recurrenceAsTarget: 0,
  };
}

async function getRelationSummaryByReportId(reportIds: string[]) {
  const summaryByReportId = new Map<string, ReportRelationSummary>();

  for (const reportId of reportIds) {
    summaryByReportId.set(reportId, emptyRelationSummary());
  }

  if (reportIds.length === 0) {
    return summaryByReportId;
  }

  const [outgoing, incoming] = await Promise.all([
    prisma.reportRelation.findMany({
      where: { sourceReportId: { in: reportIds } },
      select: { sourceReportId: true, relationType: true },
    }),
    prisma.reportRelation.findMany({
      where: { targetReportId: { in: reportIds } },
      select: { targetReportId: true, relationType: true },
    }),
  ]);

  for (const relation of outgoing) {
    const summary = summaryByReportId.get(relation.sourceReportId);

    if (!summary) continue;

    if (relation.relationType === "duplicate") {
      summary.duplicateAsSource += 1;
    }

    if (relation.relationType === "recurrence") {
      summary.recurrenceAsSource += 1;
    }
  }

  for (const relation of incoming) {
    const summary = summaryByReportId.get(relation.targetReportId);

    if (!summary) continue;

    if (relation.relationType === "duplicate") {
      summary.duplicateAsTarget += 1;
    }

    if (relation.relationType === "recurrence") {
      summary.recurrenceAsTarget += 1;
    }
  }

  return summaryByReportId;
}

export async function getActiveAgencies() {
  const agencies = await prisma.agency.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const relationSummaryByReportId = await getRelationSummaryByReportId(
    agencies.map((agency) => agency.id)
  );

  return agencies.map((agency) => ({
    ...agency,
    relation_summary:
      relationSummaryByReportId.get(agency.id) ?? emptyRelationSummary(),
  }));
}

export async function getActiveVillageSections() {
  return prisma.villageSection.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getActiveSlaPriorityOptions() {
  const rules = await prisma.slaRule.findMany({
    where: { isActive: true },
    select: { priority: true, verificationHours: true, resolutionHours: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const priorityOrder: Record<string, number> = {
    darurat: 1,
    tinggi: 2,
    sedang: 3,
    rendah: 4,
  };

  const uniqueOptions = Array.from(
    new Map(rules.map((option) => [option.priority, option])).values()
  );

  return uniqueOptions
    .map((option) => ({
      priority: option.priority,
      verification_hours: option.verificationHours,
      resolution_hours: option.resolutionHours,
    }))
    .sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
    );
}

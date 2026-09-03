import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";

const LIST_LIMIT = 50;

async function requireCitizen() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "public") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

const progressStatuses = [
  "need_verification",
  "verified_valid",
  "classified",
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
];

function toDisplayUrl(filePath: string | null | undefined) {
  return filePath && filePath.startsWith("/") ? filePath : null;
}

const citizenReportListSelect = {
  id: true,
  reportNumber: true,
  title: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  category: { select: { name: true } },
  dusun: { select: { name: true } },
} as const;

function mapCitizenReportListItem(report: {
  id: string;
  reportNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  category: { name: string } | null;
  dusun: { name: string } | null;
}) {
  return {
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    priority: report.priority,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
    resolved_at: report.resolvedAt?.toISOString() ?? null,
    category: report.category,
    hamlet: report.dusun,
  };
}

export async function getCitizenDashboardData() {
  const profile = await requireCitizen();

  const reports = await prisma.report.findMany({
    where: { reporterId: profile.id },
    select: citizenReportListSelect,
    orderBy: { updatedAt: "desc" },
  });

  const mappedReports = reports.map(mapCitizenReportListItem);

  return {
    reports: mappedReports.slice(0, 5),
    stats: {
      totalReports: mappedReports.length,
      pendingReports: mappedReports.filter(
        (report) => report.status === "pending"
      ).length,
      inProcessReports: mappedReports.filter((report) =>
        progressStatuses.includes(report.status)
      ).length,
      resolvedReports: mappedReports.filter(
        (report) => report.status === "resolved"
      ).length,
      archivedReports: mappedReports.filter(
        (report) => report.status === "archived"
      ).length,
    },
  };
}

export async function getCitizenReports() {
  const profile = await requireCitizen();

  const reports = await prisma.report.findMany({
    where: { reporterId: profile.id },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: LIST_LIMIT,
  });

  return reports.map((report) => ({
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    description: report.description,
    status: report.status,
    priority: report.priority,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
    resolved_at: report.resolvedAt?.toISOString() ?? null,
    category: report.category,
    hamlet: report.dusun,
  }));
}

function mapRelatedReport(report: {
  id: string;
  reportNumber: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: Date;
  resolvedAt: Date | null;
}) {
  return {
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    priority: report.priority,
    updated_at: report.updatedAt.toISOString(),
    resolved_at: report.resolvedAt?.toISOString() ?? null,
  };
}

export async function getCitizenReportDetail(reportId: string) {
  const profile = await requireCitizen();

  const report = await prisma.report.findFirst({
    where: { id: reportId, reporterId: profile.id },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      adminNote: true,
      rejectionReason: true,
      latitude: true,
      longitude: true,
      autoAddress: true,
      manualAddress: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
    },
  });

  if (!report) {
    return null;
  }

  const [statusLogs, photos, outgoingRelations, incomingRelations] =
    await Promise.all([
      prisma.reportStatusLog.findMany({
        where: { reportId },
        select: { id: true, oldStatus: true, newStatus: true, note: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.reportPhoto.findMany({
        where: { reportId },
        select: { id: true, filePath: true, photoUrl: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.reportRelation.findMany({
        where: { sourceReportId: reportId },
        select: {
          id: true,
          relationType: true,
          note: true,
          createdAt: true,
          targetReport: {
            select: {
              id: true,
              reportNumber: true,
              title: true,
              status: true,
              priority: true,
              updatedAt: true,
              resolvedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.reportRelation.findMany({
        where: { targetReportId: reportId },
        select: {
          id: true,
          relationType: true,
          note: true,
          createdAt: true,
          sourceReport: {
            select: {
              id: true,
              reportNumber: true,
              title: true,
              status: true,
              priority: true,
              updatedAt: true,
              resolvedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const signedPhotos = photos.map((photo) => ({
    id: photo.id,
    file_path: photo.filePath,
    photo_url: photo.photoUrl,
    created_at: photo.createdAt.toISOString(),
    signed_url: toDisplayUrl(photo.filePath),
  }));

  return {
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    description: report.description,
    status: report.status,
    priority: report.priority,
    admin_note: report.adminNote,
    rejection_reason: report.rejectionReason,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    auto_address: report.autoAddress,
    manual_address: report.manualAddress,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
    resolved_at: report.resolvedAt?.toISOString() ?? null,
    category: report.category,
    hamlet: report.dusun,
    photos: signedPhotos,
    status_logs: statusLogs.map((log) => ({
      id: log.id,
      old_status: log.oldStatus,
      new_status: log.newStatus,
      note: log.note,
      created_at: log.createdAt.toISOString(),
    })),
    report_relations: {
      schemaReady: true,
      outgoing: outgoingRelations.map((relation) => ({
        id: relation.id,
        relation_type: relation.relationType as "duplicate" | "recurrence",
        note: relation.note,
        created_at: relation.createdAt.toISOString(),
        target: mapRelatedReport(relation.targetReport),
      })),
      incoming: incomingRelations.map((relation) => ({
        id: relation.id,
        relation_type: relation.relationType as "duplicate" | "recurrence",
        note: relation.note,
        created_at: relation.createdAt.toISOString(),
        source: mapRelatedReport(relation.sourceReport),
      })),
    },
  };
}

import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";

const LIST_LIMIT = 50;

const activeStatuses = [
  "handled_by_village",
  "waiting_budget",
  "in_progress",
];

function toDisplayUrl(filePath: string | null | undefined) {
  return filePath && filePath.startsWith("/") ? filePath : null;
}

async function requireKasi() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "kasi") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

function mapReportRow(report: {
  id: string;
  reportNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  followUpType: string;
  updatedAt: Date;
  createdAt: Date;
  category: { name: string } | null;
  dusun: { name: string } | null;
  reporter: { fullName: string; email: string; phoneNumber: string | null } | null;
}) {
  return {
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    description: report.description,
    status: report.status,
    priority: report.priority,
    follow_up_type: report.followUpType,
    updated_at: report.updatedAt.toISOString(),
    created_at: report.createdAt.toISOString(),
    category: report.category,
    hamlet: report.dusun,
    reporter: report.reporter
      ? {
          full_name: report.reporter.fullName,
          email: report.reporter.email,
          phone_number: report.reporter.phoneNumber,
        }
      : null,
  };
}

const assignedReportSelect = {
  id: true,
  reportNumber: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  followUpType: true,
  updatedAt: true,
  createdAt: true,
  category: { select: { name: true } },
  dusun: { select: { name: true } },
  reporter: { select: { fullName: true, email: true, phoneNumber: true } },
} as const;

export async function getKasiDashboardData() {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      missingSection: true,
      stats: {
        totalAssignedReports: 0,
        activeReports: 0,
        waitingBudgetReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
      },
      recentReports: [],
    };
  }

  const reports = await prisma.report.findMany({
    where: { assignedSectionId: profile.section_id },
    select: assignedReportSelect,
    orderBy: { updatedAt: "desc" },
    take: LIST_LIMIT,
  });

  const mapped = reports.map(mapReportRow);

  return {
    missingSection: false,
    stats: {
      totalAssignedReports: mapped.length,
      activeReports: mapped.filter((report) =>
        activeStatuses.includes(report.status)
      ).length,
      waitingBudgetReports: mapped.filter(
        (report) => report.status === "waiting_budget"
      ).length,
      inProgressReports: mapped.filter(
        (report) => report.status === "in_progress"
      ).length,
      resolvedReports: mapped.filter((report) => report.status === "resolved")
        .length,
    },
    recentReports: mapped.slice(0, 5),
  };
}

export async function getKasiAssignedReports() {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      missingSection: true,
      reports: [],
    };
  }

  const reports = await prisma.report.findMany({
    where: { assignedSectionId: profile.section_id },
    select: assignedReportSelect,
    orderBy: { updatedAt: "desc" },
    take: LIST_LIMIT,
  });

  return {
    missingSection: false,
    reports: reports.map(mapReportRow),
  };
}

export async function getKasiReportDetail(reportId: string) {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return null;
  }

  const report = await prisma.report.findFirst({
    where: { id: reportId, assignedSectionId: profile.section_id },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      assetStatus: true,
      authorityLevel: true,
      followUpType: true,
      latitude: true,
      longitude: true,
      autoAddress: true,
      manualAddress: true,
      internalHandlingNote: true,
      verificationDueAt: true,
      resolutionDueAt: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
      reporter: { select: { fullName: true, email: true, phoneNumber: true } },
    },
  });

  if (!report) {
    return null;
  }

  const section = await prisma.villageSection.findUnique({
    where: { id: profile.section_id },
    select: { name: true },
  });

  const photos = await prisma.reportPhoto.findMany({
    where: { reportId },
    select: { id: true, filePath: true, photoUrl: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const signedPhotos = photos.map((photo) => ({
    id: photo.id,
    file_path: photo.filePath,
    photo_url: photo.photoUrl,
    created_at: photo.createdAt.toISOString(),
    signedUrl: toDisplayUrl(photo.filePath),
  }));

  const statusLogs = await prisma.reportStatusLog.findMany({
    where: { reportId },
    select: { id: true, oldStatus: true, newStatus: true, note: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const progressUpdates = await prisma.reportProgressUpdate.findMany({
    where: { reportId },
    select: {
      id: true,
      progressTitle: true,
      progressNote: true,
      progressStatus: true,
      createdBy: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const progressUpdateIds = progressUpdates.map((update) => update.id);
  const progressPhotos =
    progressUpdateIds.length > 0
      ? await prisma.reportProgressPhoto.findMany({
          where: { progressUpdateId: { in: progressUpdateIds } },
          select: {
            id: true,
            progressUpdateId: true,
            filePath: true,
            photoUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const signedProgressPhotos = progressPhotos.map((photo) => ({
    id: photo.id,
    progress_update_id: photo.progressUpdateId,
    file_path: photo.filePath,
    photo_url: photo.photoUrl,
    created_at: photo.createdAt.toISOString(),
    signedUrl: toDisplayUrl(photo.filePath),
  }));

  const progressUpdatesWithPhotos = progressUpdates.map((update) => ({
    id: update.id,
    update_type: update.progressStatus,
    title: update.progressTitle,
    note: update.progressNote ?? "",
    created_by: update.createdBy,
    created_at: update.createdAt.toISOString(),
    photos: signedProgressPhotos.filter(
      (photo) => photo.progress_update_id === update.id
    ),
  }));

  const budgetRequests = await prisma.reportBudgetRequest.findMany({
    where: { reportId, sectionId: profile.section_id },
    select: {
      id: true,
      reportId: true,
      summaryNote: true,
      totalEstimatedBudget: true,
      status: true,
      reviewedBy: true,
      reviewedAt: true,
      reviewNote: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const budgetRequestIds = budgetRequests.map((request) => request.id);
  const reviewerIds = Array.from(
    new Set(
      budgetRequests
        .map((request) => request.reviewedBy)
        .filter((id): id is string => Boolean(id))
    )
  );

  const [budgetItems, reviewers] = await Promise.all([
    budgetRequestIds.length > 0
      ? prisma.reportBudgetRequestItem.findMany({
          where: { budgetRequestId: { in: budgetRequestIds } },
          select: {
            id: true,
            budgetRequestId: true,
            itemName: true,
            description: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            subtotal: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    reviewerIds.length > 0
      ? prisma.profile.findMany({
          where: { id: { in: reviewerIds } },
          select: { id: true, fullName: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  const reviewerById = new Map(
    reviewers.map((reviewer) => [
      reviewer.id,
      { full_name: reviewer.fullName, email: reviewer.email },
    ])
  );

  const budgetRequestsWithItems = budgetRequests.map((request) => ({
    id: request.id,
    report_id: request.reportId,
    summary_note: request.summaryNote,
    total_estimated_budget: Number(request.totalEstimatedBudget || 0),
    status: request.status,
    reviewed_by: request.reviewedBy,
    reviewed_at: request.reviewedAt?.toISOString() ?? null,
    review_note: request.reviewNote,
    created_at: request.createdAt.toISOString(),
    updated_at: request.updatedAt.toISOString(),
    reviewer: request.reviewedBy
      ? reviewerById.get(request.reviewedBy) ?? null
      : null,
    items: budgetItems
      .filter((item) => item.budgetRequestId === request.id)
      .map((item) => ({
        id: item.id,
        budget_request_id: item.budgetRequestId,
        item_name: item.itemName,
        description: item.description,
        quantity: Number(item.quantity || 0),
        unit: item.unit,
        unit_price: Number(item.unitPrice || 0),
        subtotal: Number(item.subtotal || 0),
        created_at: item.createdAt.toISOString(),
      })),
  }));

  return {
    report: {
      id: report.id,
      report_number: report.reportNumber,
      title: report.title,
      description: report.description,
      status: report.status,
      priority: report.priority,
      asset_status: report.assetStatus,
      authority_level: report.authorityLevel,
      follow_up_type: report.followUpType,
      latitude: Number(report.latitude),
      longitude: Number(report.longitude),
      auto_address: report.autoAddress,
      manual_address: report.manualAddress,
      internal_handling_note: report.internalHandlingNote,
      verification_due_at: report.verificationDueAt?.toISOString() ?? null,
      resolution_due_at: report.resolutionDueAt?.toISOString() ?? null,
      resolved_at: report.resolvedAt?.toISOString() ?? null,
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
      category: report.category,
      hamlet: report.dusun,
      section,
      reporter: report.reporter
        ? {
            full_name: report.reporter.fullName,
            email: report.reporter.email,
            phone_number: report.reporter.phoneNumber,
          }
        : null,
    },
    photos: signedPhotos,
    statusLogs: statusLogs.map((log) => ({
      id: log.id,
      old_status: log.oldStatus,
      new_status: log.newStatus,
      note: log.note,
      created_at: log.createdAt.toISOString(),
    })),
    progressUpdates: progressUpdatesWithPhotos,
    budgetRequests: budgetRequestsWithItems,
  };
}

export async function getKasiProgressHistory() {
  const { missingSection, reports } = await getKasiAssignedReports();

  return {
    missingSection,
    reports: reports.filter((report) =>
      [
        "handled_by_village",
        "waiting_budget",
        "in_progress",
        "resolved",
        "archived",
      ].includes(report.status)
    ),
  };
}

export async function getKasiBudgetPageData() {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      missingSection: true,
      budgetSchemaReady: true,
      eligibleReports: [],
      budgetRequests: [],
    };
  }

  const eligibleReportsRaw = await prisma.report.findMany({
    where: {
      assignedSectionId: profile.section_id,
      status: { in: ["handled_by_village", "in_progress"] },
    },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      priority: true,
      updatedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: LIST_LIMIT,
  });

  const eligibleReports = eligibleReportsRaw.map((report) => ({
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    priority: report.priority,
    updated_at: report.updatedAt.toISOString(),
    category: report.category,
    hamlet: report.dusun,
  }));

  const budgetRequests = await prisma.reportBudgetRequest.findMany({
    where: { sectionId: profile.section_id },
    select: {
      id: true,
      reportId: true,
      summaryNote: true,
      totalEstimatedBudget: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });

  const requestReportIds = Array.from(
    new Set(budgetRequests.map((request) => request.reportId))
  );
  const requestIds = budgetRequests.map((request) => request.id);
  const pendingBudgetReportIds = new Set(
    budgetRequests
      .filter((request) => request.status === "submitted")
      .map((request) => request.reportId)
  );

  const [requestReports, requestItems] = await Promise.all([
    requestReportIds.length > 0
      ? prisma.report.findMany({
          where: { id: { in: requestReportIds } },
          select: { id: true, reportNumber: true, title: true, status: true, priority: true },
        })
      : Promise.resolve([]),
    requestIds.length > 0
      ? prisma.reportBudgetRequestItem.findMany({
          where: { budgetRequestId: { in: requestIds } },
          select: {
            id: true,
            budgetRequestId: true,
            itemName: true,
            description: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            subtotal: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const reportById = new Map(
    requestReports.map((report) => [
      report.id,
      {
        id: report.id,
        report_number: report.reportNumber,
        title: report.title,
        status: report.status,
        priority: report.priority,
      },
    ])
  );

  return {
    missingSection: false,
    budgetSchemaReady: true,
    eligibleReports: eligibleReports.filter(
      (report) => !pendingBudgetReportIds.has(report.id)
    ),
    budgetRequests: budgetRequests.map((request) => ({
      id: request.id,
      report_id: request.reportId,
      summary_note: request.summaryNote,
      total_estimated_budget: Number(request.totalEstimatedBudget || 0),
      status: request.status,
      created_at: request.createdAt.toISOString(),
      updated_at: request.updatedAt.toISOString(),
      report: reportById.get(request.reportId) ?? null,
      items: requestItems
        .filter((item) => item.budgetRequestId === request.id)
        .map((item) => ({
          id: item.id,
          budget_request_id: item.budgetRequestId,
          item_name: item.itemName,
          description: item.description,
          quantity: Number(item.quantity || 0),
          unit: item.unit,
          unit_price: Number(item.unitPrice || 0),
          subtotal: Number(item.subtotal || 0),
        })),
    })),
  };
}

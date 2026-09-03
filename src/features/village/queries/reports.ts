import { getProfile } from "@/src/lib/auth/getProfile";
import { prisma } from "@/src/lib/prisma";

const LIST_LIMIT = 50;

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

function toDisplayUrl(filePath: string | null | undefined) {
  return filePath && filePath.startsWith("/") ? filePath : null;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

type PhotoRow = {
  id: string;
  filePath: string;
  photoUrl: string;
  createdAt: Date;
};

function mapPhotosWithSignedUrls(photos: PhotoRow[]) {
  return photos.map((photo) => ({
    id: photo.id,
    file_path: photo.filePath,
    photo_url: photo.photoUrl,
    created_at: photo.createdAt.toISOString(),
    signed_url: toDisplayUrl(photo.filePath),
  }));
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

export async function getVillageArchivedReports() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return [];
  }

  const reports = await prisma.report.findMany({
    where: { status: "archived" },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      priority: true,
      assetStatus: true,
      authorityLevel: true,
      followUpType: true,
      resolvedAt: true,
      updatedAt: true,
      createdAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
      reporter: { select: { fullName: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: LIST_LIMIT,
  });

  return reports.map((report) => ({
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    priority: report.priority,
    asset_status: report.assetStatus,
    authority_level: report.authorityLevel,
    follow_up_type: report.followUpType,
    resolved_at: report.resolvedAt?.toISOString() ?? null,
    updated_at: report.updatedAt.toISOString(),
    created_at: report.createdAt.toISOString(),
    category: report.category,
    hamlet: report.dusun,
    reporter: report.reporter
      ? { full_name: report.reporter.fullName, email: report.reporter.email }
      : null,
  }));
}

export async function getVillageArchivedReportDetail(reportId: string) {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return null;
  }

  const report = await prisma.report.findFirst({
    where: { id: reportId, status: "archived" },
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
      adminNote: true,
      rejectionReason: true,
      latitude: true,
      longitude: true,
      autoAddress: true,
      manualAddress: true,
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

  const reportPhotos = await prisma.reportPhoto.findMany({
    where: { reportId },
    select: { id: true, filePath: true, photoUrl: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const verification = await prisma.reportVerification.findFirst({
    where: { reportId },
    select: {
      id: true,
      verifiedBy: true,
      isValid: true,
      verificationNote: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  let verificationData = null;

  if (verification) {
    const [verifier, verificationPhotos] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: verification.verifiedBy },
        select: { fullName: true, email: true },
      }),
      prisma.verificationPhoto.findMany({
        where: { verificationId: verification.id },
        select: { id: true, filePath: true, photoUrl: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    verificationData = {
      id: verification.id,
      is_valid: verification.isValid,
      verification_note: verification.verificationNote,
      created_at: verification.createdAt.toISOString(),
      verifier: verifier
        ? { full_name: verifier.fullName, email: verifier.email }
        : null,
      photos: mapPhotosWithSignedUrls(verificationPhotos),
    };
  }

  const statusLogs = await prisma.reportStatusLog.findMany({
    where: { reportId },
    select: { id: true, oldStatus: true, newStatus: true, note: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    description: report.description,
    status: report.status,
    priority: report.priority,
    asset_status: report.assetStatus,
    authority_level: report.authorityLevel,
    follow_up_type: report.followUpType,
    admin_note: report.adminNote,
    rejection_reason: report.rejectionReason,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    auto_address: report.autoAddress,
    manual_address: report.manualAddress,
    verification_due_at: report.verificationDueAt?.toISOString() ?? null,
    resolution_due_at: report.resolutionDueAt?.toISOString() ?? null,
    resolved_at: report.resolvedAt?.toISOString() ?? null,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
    category: report.category,
    hamlet: report.dusun,
    reporter: report.reporter
      ? {
          full_name: report.reporter.fullName,
          email: report.reporter.email,
          phone_number: report.reporter.phoneNumber,
        }
      : null,
    report_photos: mapPhotosWithSignedUrls(reportPhotos),
    verification: verificationData,
    status_logs: statusLogs.map((log) => ({
      id: log.id,
      old_status: log.oldStatus,
      new_status: log.newStatus,
      note: log.note,
      created_at: log.createdAt.toISOString(),
    })),
  };
}

export async function getVillageReportsData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      stats: {
        totalReports: 0,
        activeReports: 0,
        waitingBudgetReports: 0,
        villageHandledReports: 0,
        forwardedReports: 0,
        resolvedReports: 0,
      },
      reports: [],
      sections: [],
    };
  }

  const [reports, sections] = await Promise.all([
    prisma.report.findMany({
      select: {
        id: true,
        reportNumber: true,
        title: true,
        status: true,
        priority: true,
        assetStatus: true,
        authorityLevel: true,
        followUpType: true,
        assignedSectionId: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        category: { select: { name: true } },
        dusun: { select: { name: true } },
        reporter: { select: { fullName: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.villageSection.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const relationSummaryByReportId = await getRelationSummaryByReportId(
    reports.map((report) => report.id)
  );

  const reportRows = reports.map((report) => ({
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    priority: report.priority,
    asset_status: report.assetStatus,
    authority_level: report.authorityLevel,
    follow_up_type: report.followUpType,
    assigned_section_id: report.assignedSectionId,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
    resolved_at: report.resolvedAt?.toISOString() ?? null,
    category: report.category,
    hamlet: report.dusun,
    reporter: report.reporter
      ? { full_name: report.reporter.fullName, email: report.reporter.email }
      : null,
    section: report.assignedSectionId
      ? sectionById.get(report.assignedSectionId) ?? null
      : null,
    relation_summary:
      relationSummaryByReportId.get(report.id) ?? emptyRelationSummary(),
  }));

  return {
    stats: {
      totalReports: reportRows.length,
      activeReports: reportRows.filter((report) =>
        [
          "pending",
          "need_verification",
          "verified_valid",
          "classified",
          "handled_by_village",
          "forwarded_to_agency",
          "waiting_budget",
          "in_progress",
        ].includes(report.status)
      ).length,
      waitingBudgetReports: reportRows.filter(
        (report) => report.status === "waiting_budget"
      ).length,
      villageHandledReports: reportRows.filter((report) =>
        ["handled_by_village", "waiting_budget", "in_progress"].includes(
          report.status
        )
      ).length,
      forwardedReports: reportRows.filter(
        (report) =>
          report.status === "forwarded_to_agency" ||
          report.follow_up_type === "diteruskan_ke_dinas"
      ).length,
      resolvedReports: reportRows.filter(
        (report) => report.status === "resolved"
      ).length,
    },
    reports: reportRows,
    sections,
  };
}

export async function getVillageReportMonitoringDetail(reportId: string) {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return null;
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
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
      assignedSectionId: true,
      adminNote: true,
      internalHandlingNote: true,
      rejectionReason: true,
      latitude: true,
      longitude: true,
      autoAddress: true,
      manualAddress: true,
      verificationDueAt: true,
      resolutionDueAt: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
      reporter: { select: { fullName: true, email: true, phoneNumber: true } },
      agency: {
        select: {
          name: true,
          description: true,
          contactPerson: true,
          phone: true,
          email: true,
          address: true,
        },
      },
      assignedSection: { select: { id: true, name: true } },
    },
  });

  if (!report) {
    return null;
  }

  const [
    reportPhotos,
    statusLogs,
    verification,
    progressUpdates,
    budgetRequests,
    slaEvents,
  ] = await Promise.all([
    prisma.reportPhoto.findMany({
      where: { reportId },
      select: { id: true, filePath: true, photoUrl: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.reportStatusLog.findMany({
      where: { reportId },
      select: { id: true, oldStatus: true, newStatus: true, note: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.reportVerification.findFirst({
      where: { reportId },
      select: {
        id: true,
        verifiedBy: true,
        isValid: true,
        verificationNote: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reportProgressUpdate.findMany({
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
    }),
    prisma.reportBudgetRequest.findMany({
      where: { reportId },
      select: {
        id: true,
        summaryNote: true,
        totalEstimatedBudget: true,
        requestedBy: true,
        sectionId: true,
        status: true,
        reviewedBy: true,
        reviewedAt: true,
        reviewNote: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reportSlaEvent.findMany({
      where: { reportId },
      select: {
        id: true,
        eventType: true,
        previousResolutionDueAt: true,
        newResolutionDueAt: true,
        note: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const signedReportPhotos = mapPhotosWithSignedUrls(reportPhotos);

  let verificationData = null;

  if (verification) {
    const [verifier, verificationPhotos] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: verification.verifiedBy },
        select: { id: true, fullName: true, email: true },
      }),
      prisma.verificationPhoto.findMany({
        where: { verificationId: verification.id },
        select: { id: true, filePath: true, photoUrl: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    verificationData = {
      id: verification.id,
      is_valid: verification.isValid,
      verification_note: verification.verificationNote,
      created_at: verification.createdAt.toISOString(),
      verifier: verifier
        ? { id: verifier.id, full_name: verifier.fullName, email: verifier.email }
        : null,
      photos: mapPhotosWithSignedUrls(verificationPhotos),
    };
  }

  const progressUpdateIds = progressUpdates.map((update) => update.id);
  const progressCreatorIds = uniqueValues(
    progressUpdates
      .map((update) => update.createdBy)
      .filter((id): id is string => Boolean(id))
  );

  const [progressPhotos, progressCreators] = await Promise.all([
    progressUpdateIds.length > 0
      ? prisma.reportProgressPhoto.findMany({
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
      : Promise.resolve([]),
    progressCreatorIds.length > 0
      ? prisma.profile.findMany({
          where: { id: { in: progressCreatorIds } },
          select: { id: true, fullName: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  const signedProgressPhotos = progressPhotos.map((photo) => ({
    id: photo.id,
    progress_update_id: photo.progressUpdateId,
    file_path: photo.filePath,
    photo_url: photo.photoUrl,
    created_at: photo.createdAt.toISOString(),
    signed_url: toDisplayUrl(photo.filePath),
  }));
  const progressCreatorById = new Map(
    progressCreators.map((creator) => [
      creator.id,
      { full_name: creator.fullName, email: creator.email },
    ])
  );

  const budgetRequestIds = budgetRequests.map((request) => request.id);
  const profileIds = uniqueValues(
    [
      ...budgetRequests.map((request) => request.requestedBy),
      ...budgetRequests.map((request) => request.reviewedBy),
    ].filter((id): id is string => Boolean(id))
  );
  const sectionIds = uniqueValues(
    budgetRequests
      .map((request) => request.sectionId)
      .filter((id): id is string => Boolean(id))
  );

  const [budgetItems, budgetProfiles, budgetSections] = await Promise.all([
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
    profileIds.length > 0
      ? prisma.profile.findMany({
          where: { id: { in: profileIds } },
          select: { id: true, fullName: true, email: true },
        })
      : Promise.resolve([]),
    sectionIds.length > 0
      ? prisma.villageSection.findMany({
          where: { id: { in: sectionIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const budgetProfileById = new Map(
    budgetProfiles.map((budgetProfile) => [
      budgetProfile.id,
      { full_name: budgetProfile.fullName, email: budgetProfile.email },
    ])
  );
  const budgetSectionById = new Map(
    budgetSections.map((budgetSection) => [budgetSection.id, budgetSection])
  );

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
      assigned_section_id: report.assignedSectionId,
      admin_note: report.adminNote,
      internal_handling_note: report.internalHandlingNote,
      rejection_reason: report.rejectionReason,
      latitude: Number(report.latitude),
      longitude: Number(report.longitude),
      auto_address: report.autoAddress,
      manual_address: report.manualAddress,
      verification_due_at: report.verificationDueAt?.toISOString() ?? null,
      resolution_due_at: report.resolutionDueAt?.toISOString() ?? null,
      resolved_at: report.resolvedAt?.toISOString() ?? null,
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
      category: report.category,
      hamlet: report.dusun,
      reporter: report.reporter
        ? {
            full_name: report.reporter.fullName,
            email: report.reporter.email,
            phone_number: report.reporter.phoneNumber,
          }
        : null,
      agency: report.agency
        ? {
            name: report.agency.name,
            description: report.agency.description,
            contact_person: report.agency.contactPerson,
            phone: report.agency.phone,
            email: report.agency.email,
            address: report.agency.address,
          }
        : null,
      section: report.assignedSection,
    },
    photos: signedReportPhotos,
    statusLogs: statusLogs.map((log) => ({
      id: log.id,
      old_status: log.oldStatus,
      new_status: log.newStatus,
      note: log.note,
      created_at: log.createdAt.toISOString(),
    })),
    slaEvents: {
      schemaReady: true,
      events: slaEvents.map((event) => ({
        id: event.id,
        event_type: event.eventType,
        previous_resolution_due_at: event.previousResolutionDueAt?.toISOString() ?? null,
        new_resolution_due_at: event.newResolutionDueAt?.toISOString() ?? null,
        note: event.note,
        created_at: event.createdAt.toISOString(),
      })),
    },
    verification: verificationData,
    progressUpdates: progressUpdates.map((update) => ({
      id: update.id,
      title: update.progressTitle,
      note: update.progressNote,
      status: update.progressStatus,
      created_at: update.createdAt.toISOString(),
      creator: update.createdBy
        ? progressCreatorById.get(update.createdBy) ?? null
        : null,
      photos: signedProgressPhotos.filter(
        (photo) => photo.progress_update_id === update.id
      ),
    })),
    budgetRequests: budgetRequests.map((request) => ({
      id: request.id,
      note: request.summaryNote,
      estimated_budget: Number(request.totalEstimatedBudget || 0),
      status: request.status,
      created_at: request.createdAt.toISOString(),
      updated_at: request.updatedAt.toISOString(),
      reviewed_at: request.reviewedAt?.toISOString() ?? null,
      review_note: request.reviewNote,
      requester: request.requestedBy
        ? budgetProfileById.get(request.requestedBy) ?? null
        : null,
      reviewer: request.reviewedBy
        ? budgetProfileById.get(request.reviewedBy) ?? null
        : null,
      section: request.sectionId
        ? budgetSectionById.get(request.sectionId) ?? null
        : null,
      items: budgetItems
        .filter((item) => item.budgetRequestId === request.id)
        .map((item) => ({
          id: item.id,
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

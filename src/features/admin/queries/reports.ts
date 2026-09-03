import { prisma } from "@/src/lib/prisma";
import type { ReportStatus } from "@prisma/client";
import { LIST_LIMIT } from "./shared";

const ACTIVE_RELATION_STATUSES: ReportStatus[] = [
  "pending",
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

export async function getAdminReports() {
  const reports = await prisma.report.findMany({
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      priority: true,
      assetStatus: true,
      authorityLevel: true,
      followUpType: true,
      createdAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
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
    created_at: report.createdAt.toISOString(),
    categories: report.category ? [report.category] : null,
    dusuns: report.dusun ? [report.dusun] : null,
  }));
}

export async function getAdminReportDetail(reportId: string) {
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
      latitude: true,
      longitude: true,
      autoAddress: true,
      manualAddress: true,
      rejectionReason: true,
      adminNote: true,
      verificationDueAt: true,
      resolutionDueAt: true,
      resolvedAt: true,
      slaStatus: true,
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
    },
  });

  if (!report) {
    return null;
  }

  const photos = await prisma.reportPhoto.findMany({
    where: { reportId },
    select: { id: true, filePath: true, photoUrl: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const photosWithSignedUrls = photos.map((photo) => ({
    id: photo.id,
    file_path: photo.filePath,
    photo_url: photo.photoUrl,
    created_at: photo.createdAt.toISOString(),
    signedUrl: toDisplayUrl(photo.filePath),
  }));

  const verification = await prisma.reportVerification.findFirst({
    where: { reportId },
    select: { id: true, isValid: true, verificationNote: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  let verificationPhotosWithSignedUrls: {
    id: string;
    file_path: string;
    photo_url: string;
    created_at: string;
    signedUrl: string | null;
  }[] = [];

  if (verification) {
    const verificationPhotos = await prisma.verificationPhoto.findMany({
      where: { verificationId: verification.id },
      select: { id: true, filePath: true, photoUrl: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    verificationPhotosWithSignedUrls = verificationPhotos.map((photo) => ({
      id: photo.id,
      file_path: photo.filePath,
      photo_url: photo.photoUrl,
      created_at: photo.createdAt.toISOString(),
      signedUrl: toDisplayUrl(photo.filePath),
    }));
  }

  const statusLogs = await prisma.reportStatusLog.findMany({
    where: { reportId },
    select: { id: true, oldStatus: true, newStatus: true, note: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const [outgoing, incoming, activeCandidates, recurrenceCandidates, slaEvents] =
    await Promise.all([
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
              createdAt: true,
              updatedAt: true,
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
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.report.findMany({
        where: { id: { not: reportId }, status: { in: ACTIVE_RELATION_STATUSES } },
        select: {
          id: true,
          reportNumber: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          manualAddress: true,
          autoAddress: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { name: true } },
          dusun: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      prisma.report.findMany({
        where: { id: { not: reportId }, status: { in: ["resolved", "archived"] } },
        select: {
          id: true,
          reportNumber: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          manualAddress: true,
          autoAddress: true,
          resolvedAt: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { name: true } },
          dusun: { select: { name: true } },
        },
        orderBy: { resolvedAt: "desc" },
        take: 100,
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

  const activeCandidateIds = activeCandidates.map((candidate) => candidate.id);
  const sourceRelations =
    activeCandidateIds.length > 0
      ? await prisma.reportRelation.findMany({
          where: { sourceReportId: { in: activeCandidateIds } },
          select: { sourceReportId: true, relationType: true },
        })
      : [];

  const duplicateSourceIds = new Set(
    sourceRelations
      .filter((relation) => relation.relationType === "duplicate")
      .map((relation) => relation.sourceReportId)
  );
  const recurrenceSourceIds = new Set(
    sourceRelations
      .filter((relation) => relation.relationType === "recurrence")
      .map((relation) => relation.sourceReportId)
  );

  const mapCandidate = (candidate: (typeof activeCandidates)[number]) => ({
    id: candidate.id,
    report_number: candidate.reportNumber,
    title: candidate.title,
    description: candidate.description,
    status: candidate.status,
    priority: candidate.priority,
    created_at: candidate.createdAt.toISOString(),
    updated_at: candidate.updatedAt.toISOString(),
    manual_address: candidate.manualAddress,
    auto_address: candidate.autoAddress,
    category: candidate.category,
    hamlet: candidate.dusun,
  });

  const duplicateCandidates = activeCandidates
    .filter((candidate) => !duplicateSourceIds.has(candidate.id))
    .map(mapCandidate);
  const recurringSourceCandidates = activeCandidates
    .filter((candidate) => !recurrenceSourceIds.has(candidate.id))
    .map(mapCandidate);
  const recurrenceCandidatesMapped = recurrenceCandidates.map((candidate) => ({
    id: candidate.id,
    report_number: candidate.reportNumber,
    title: candidate.title,
    description: candidate.description,
    status: candidate.status,
    priority: candidate.priority,
    resolved_at: candidate.resolvedAt?.toISOString() ?? null,
    created_at: candidate.createdAt.toISOString(),
    updated_at: candidate.updatedAt.toISOString(),
    manual_address: candidate.manualAddress,
    auto_address: candidate.autoAddress,
    category: candidate.category,
    hamlet: candidate.dusun,
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
      rejection_reason: report.rejectionReason,
      admin_note: report.adminNote,
      verification_due_at: report.verificationDueAt?.toISOString() ?? null,
      resolution_due_at: report.resolutionDueAt?.toISOString() ?? null,
      resolved_at: report.resolvedAt?.toISOString() ?? null,
      sla_status: report.slaStatus,
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
    },
    photos: photosWithSignedUrls,
    verification: verification
      ? {
          id: verification.id,
          is_valid: verification.isValid,
          verification_note: verification.verificationNote,
          created_at: verification.createdAt.toISOString(),
        }
      : null,
    verificationPhotos: verificationPhotosWithSignedUrls,
    status_logs: statusLogs.map((log) => ({
      id: log.id,
      old_status: log.oldStatus,
      new_status: log.newStatus,
      note: log.note,
      created_at: log.createdAt.toISOString(),
    })),
    report_relations: {
      schemaReady: true,
      outgoing: outgoing.map((relation) => ({
        id: relation.id,
        relation_type: relation.relationType as "duplicate" | "recurrence",
        note: relation.note,
        created_at: relation.createdAt.toISOString(),
        target: relation.targetReport
          ? {
              id: relation.targetReport.id,
              report_number: relation.targetReport.reportNumber,
              title: relation.targetReport.title,
              status: relation.targetReport.status,
              priority: relation.targetReport.priority,
              created_at: relation.targetReport.createdAt.toISOString(),
              updated_at: relation.targetReport.updatedAt.toISOString(),
            }
          : null,
      })),
      incoming: incoming.map((relation) => ({
        id: relation.id,
        relation_type: relation.relationType as "duplicate" | "recurrence",
        note: relation.note,
        created_at: relation.createdAt.toISOString(),
        source: relation.sourceReport
          ? {
              id: relation.sourceReport.id,
              report_number: relation.sourceReport.reportNumber,
              title: relation.sourceReport.title,
              status: relation.sourceReport.status,
              priority: relation.sourceReport.priority,
              created_at: relation.sourceReport.createdAt.toISOString(),
              updated_at: relation.sourceReport.updatedAt.toISOString(),
            }
          : null,
      })),
      duplicateCandidates,
      recurringSourceCandidates,
      recurrenceCandidates: recurrenceCandidatesMapped,
    },
    sla_events: {
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
  };
}

export async function getAdminReportReviewOptions() {
  const [categories, hamlets] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.dusun.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    categories,
    hamlets,
  };
}

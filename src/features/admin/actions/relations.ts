"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { ReportRelationType, ReportStatus } from "@prisma/client";
import type { ActionState } from "@/src/types/action";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import { notifyReporterRecurringIssue } from "@/src/features/reports/internalNotifications";
import { requireAdmin } from "./shared";

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

const RECURRENCE_REFERENCE_STATUSES: ReportStatus[] = ["resolved", "archived"];

export async function linkRelatedReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const sourceReportId = String(formData.get("source_report_id") || "").trim();
  const targetReportId = String(formData.get("target_report_id") || "").trim();
  const relationType = String(formData.get("relation_type") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!sourceReportId || !targetReportId) {
    return {
      status: "error",
      message: "Pilih laporan yang ingin ditautkan.",
    };
  }

  if (sourceReportId === targetReportId) {
    return {
      status: "error",
      message: "Laporan tidak bisa ditautkan ke dirinya sendiri.",
    };
  }

  if (!["duplicate", "recurrence"].includes(relationType)) {
    return {
      status: "error",
      message: "Pilih jenis relasi yang valid.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Tambahkan catatan yang menjelaskan relasi laporan.",
    };
  }

  const reports = await prisma.report.findMany({
    where: { id: { in: [sourceReportId, targetReportId] } },
    select: { id: true, reportNumber: true, title: true, status: true },
  });

  const sourceReport = reports.find((report) => report.id === sourceReportId);
  const targetReport = reports.find((report) => report.id === targetReportId);

  if (!sourceReport || !targetReport) {
    return {
      status: "error",
      message: "Laporan sumber atau laporan tujuan tidak ditemukan.",
    };
  }

  if (!ACTIVE_RELATION_STATUSES.includes(sourceReport.status)) {
    return {
      status: "error",
      message:
        "Hanya laporan aktif yang bisa ditautkan sebagai duplikat atau masalah berulang.",
    };
  }

  if (
    relationType === "duplicate" &&
    !ACTIVE_RELATION_STATUSES.includes(targetReport.status)
  ) {
    return {
      status: "error",
      message:
        "Laporan duplikat harus ditautkan ke laporan master yang masih aktif.",
    };
  }

  if (
    relationType === "recurrence" &&
    !RECURRENCE_REFERENCE_STATUSES.includes(targetReport.status)
  ) {
    return {
      status: "error",
      message:
        "Masalah berulang harus ditautkan ke laporan sebelumnya yang sudah selesai.",
    };
  }

  const existingSourceRelations = await prisma.reportRelation.findMany({
    where: { sourceReportId },
    select: { relationType: true },
  });

  const hasSameRelation = existingSourceRelations.some(
    (relation) => relation.relationType === relationType
  );

  if (hasSameRelation) {
    return {
      status: "error",
      message:
        relationType === "duplicate"
          ? "Laporan ini sudah digabung sebagai duplikat."
          : "Laporan ini sudah ditandai sebagai masalah berulang.",
    };
  }

  try {
    await prisma.reportRelation.create({
      data: {
        sourceReportId,
        targetReportId,
        relationType: relationType as ReportRelationType,
        note,
        createdBy: profile.id,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Relasi laporan ini sudah ada.",
    };
  }

  if (relationType === "duplicate") {
    const { count: mergedCount } = await prisma.report.updateMany({
      where: { id: sourceReportId, status: sourceReport.status },
      data: { status: "merged", slaStatus: "completed" },
    });

    if (mergedCount === 0) {
      await prisma.reportRelation.deleteMany({
        where: {
          sourceReportId,
          targetReportId,
          relationType: "duplicate",
        },
      });

      return {
        status: "error",
        message: "Laporan ini tidak bisa digabung karena statusnya sudah berubah.",
      };
    }

    await createReportStatusLog({
      reportId: sourceReportId,
      oldStatus: sourceReport.status,
      newStatus: "merged",
      note: `Laporan digabung ke ${targetReport.reportNumber}. ${note}`,
    });

    await recordSlaEvent({
      reportId: sourceReportId,
      eventType: "merged",
      note: `SLA dihentikan karena laporan ini digabung ke ${targetReport.reportNumber}.`,
    });

    await createReportStatusLog({
      reportId: targetReportId,
      oldStatus: targetReport.status,
      newStatus: targetReport.status,
      note: `Laporan duplikat ${sourceReport.reportNumber} digabung ke laporan master ini. ${note}`,
      notifyReporter: false,
      notifyWhatsApp: false,
    });
  }

  if (relationType === "recurrence") {
    await createReportStatusLog({
      reportId: sourceReportId,
      oldStatus: sourceReport.status,
      newStatus: sourceReport.status,
      note: `Laporan ditandai sebagai masalah berulang dari ${targetReport.reportNumber}. ${note}`,
      notifyReporter: false,
      notifyWhatsApp: false,
    });

    await notifyReporterRecurringIssue({
      sourceReportId,
      targetReportId,
      note,
    });
  }

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${sourceReportId}`);
  revalidatePath(`/dashboard/admin/reports/${targetReportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/village/reports");
  revalidatePath(`/dashboard/village/reports/${sourceReportId}`);
  revalidatePath(`/dashboard/village/reports/${targetReportId}`);
  revalidatePath("/dashboard/public");
  revalidatePath("/dashboard/public/reports");
  revalidatePath(`/dashboard/public/reports/${sourceReportId}`);

  return {
    status: "success",
    message:
      relationType === "duplicate"
        ? "Laporan duplikat berhasil digabung ke laporan master."
        : "Relasi masalah berulang berhasil dicatat.",
  };
}

export async function bulkMergeDuplicateReports(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const masterReportId = String(formData.get("master_report_id") || "").trim();
  const sourceReportIds = Array.from(
    new Set(
      formData
        .getAll("source_report_ids")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
  const note = String(formData.get("bulk_note") || "").trim();

  if (!masterReportId) {
    return {
      status: "error",
      message: "ID laporan master tidak ditemukan.",
    };
  }

  if (sourceReportIds.length === 0) {
    return {
      status: "error",
      message: "Pilih minimal satu laporan duplikat untuk digabung.",
    };
  }

  if (sourceReportIds.includes(masterReportId)) {
    return {
      status: "error",
      message: "Laporan tidak bisa digabung ke dirinya sendiri.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Tambahkan catatan yang menjelaskan merge bulk ini.",
    };
  }

  const reports = await prisma.report.findMany({
    where: { id: { in: [masterReportId, ...sourceReportIds] } },
    select: { id: true, reportNumber: true, title: true, status: true },
  });

  const masterReport = reports.find((report) => report.id === masterReportId);
  const sourceReports = reports.filter((report) =>
    sourceReportIds.includes(report.id)
  );

  if (!masterReport) {
    return {
      status: "error",
      message: "Laporan master tidak ditemukan.",
    };
  }

  if (!ACTIVE_RELATION_STATUSES.includes(masterReport.status)) {
    return {
      status: "error",
      message: "Merge duplikat bulk membutuhkan laporan master yang masih aktif.",
    };
  }

  if (sourceReports.length !== sourceReportIds.length) {
    return {
      status: "error",
      message: "Satu atau lebih laporan duplikat yang dipilih tidak ditemukan.",
    };
  }

  const invalidSource = sourceReports.find(
    (report) => !ACTIVE_RELATION_STATUSES.includes(report.status)
  );

  if (invalidSource) {
    return {
      status: "error",
      message: `Laporan ${invalidSource.reportNumber} tidak lagi aktif dan tidak bisa digabung.`,
    };
  }

  const existingDuplicateRelations = await prisma.reportRelation.findMany({
    where: { sourceReportId: { in: sourceReportIds }, relationType: "duplicate" },
    select: { sourceReportId: true },
  });

  if (existingDuplicateRelations.length > 0) {
    const relatedSourceIds = new Set(
      existingDuplicateRelations.map((relation) => relation.sourceReportId)
    );
    const relatedReport = sourceReports.find((report) =>
      relatedSourceIds.has(report.id)
    );

    return {
      status: "error",
      message: relatedReport
        ? `Laporan ${relatedReport.reportNumber} sudah digabung sebagai duplikat.`
        : "Satu atau lebih laporan yang dipilih sudah digabung sebagai duplikat.",
    };
  }

  try {
    await prisma.reportRelation.createMany({
      data: sourceReports.map((report) => ({
        sourceReportId: report.id,
        targetReportId: masterReportId,
        relationType: "duplicate" as ReportRelationType,
        note,
        createdBy: profile.id,
      })),
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menyimpan relasi laporan.",
    };
  }

  const { count: mergedCount } = await prisma.report.updateMany({
    where: { id: { in: sourceReportIds }, status: { in: ACTIVE_RELATION_STATUSES } },
    data: { status: "merged", slaStatus: "completed" },
  });

  if (mergedCount !== sourceReports.length) {
    await prisma.reportRelation.deleteMany({
      where: {
        sourceReportId: { in: sourceReportIds },
        targetReportId: masterReportId,
        relationType: "duplicate",
      },
    });

    return {
      status: "error",
      message: "Satu atau lebih laporan tidak bisa digabung karena statusnya sudah berubah.",
    };
  }

  for (const sourceReport of sourceReports) {
    await createReportStatusLog({
      reportId: sourceReport.id,
      oldStatus: sourceReport.status,
      newStatus: "merged",
      note: `Laporan digabung ke ${masterReport.reportNumber}. ${note}`,
    });

    await recordSlaEvent({
      reportId: sourceReport.id,
      eventType: "merged",
      note: `SLA dihentikan karena laporan ini digabung ke ${masterReport.reportNumber}.`,
    });
  }

  await createReportStatusLog({
    reportId: masterReportId,
    oldStatus: masterReport.status,
    newStatus: masterReport.status,
    note: `Merge duplikat bulk: ${sourceReports.length} laporan digabung ke laporan master ini. ${note}`,
    notifyReporter: false,
    notifyWhatsApp: false,
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${masterReportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/village/reports");
  revalidatePath(`/dashboard/village/reports/${masterReportId}`);
  revalidatePath("/dashboard/public/reports");

  for (const sourceReportId of sourceReportIds) {
    revalidatePath(`/dashboard/admin/reports/${sourceReportId}`);
    revalidatePath(`/dashboard/village/reports/${sourceReportId}`);
    revalidatePath(`/dashboard/public/reports/${sourceReportId}`);
  }

  return {
    status: "success",
    message: `${sourceReports.length} laporan duplikat berhasil digabung ke ${masterReport.reportNumber}.`,
  };
}

export async function bulkMarkRecurringReports(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const targetReportId = String(formData.get("target_report_id") || "").trim();
  const sourceReportIds = Array.from(
    new Set(
      formData
        .getAll("source_report_ids")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
  const note = String(formData.get("bulk_note") || "").trim();

  if (!targetReportId) {
    return {
      status: "error",
      message: "ID laporan referensi yang sudah selesai tidak ditemukan.",
    };
  }

  if (sourceReportIds.length === 0) {
    return {
      status: "error",
      message: "Pilih minimal satu laporan aktif untuk ditandai sebagai masalah berulang.",
    };
  }

  if (sourceReportIds.includes(targetReportId)) {
    return {
      status: "error",
      message: "Laporan tidak bisa ditautkan ke dirinya sendiri.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Tambahkan catatan yang menjelaskan masalah berulang ini.",
    };
  }

  const reports = await prisma.report.findMany({
    where: { id: { in: [targetReportId, ...sourceReportIds] } },
    select: { id: true, reportNumber: true, title: true, status: true },
  });

  const targetReport = reports.find((report) => report.id === targetReportId);
  const sourceReports = reports.filter((report) =>
    sourceReportIds.includes(report.id)
  );

  if (!targetReport) {
    return {
      status: "error",
      message: "Laporan referensi yang sudah selesai tidak ditemukan.",
    };
  }

  if (!RECURRENCE_REFERENCE_STATUSES.includes(targetReport.status)) {
    return {
      status: "error",
      message:
        "Masalah berulang bulk harus ditautkan ke laporan yang sudah selesai atau diarsipkan.",
    };
  }

  if (sourceReports.length !== sourceReportIds.length) {
    return {
      status: "error",
      message: "Satu atau lebih laporan berulang yang dipilih tidak ditemukan.",
    };
  }

  const invalidSource = sourceReports.find(
    (report) => !ACTIVE_RELATION_STATUSES.includes(report.status)
  );

  if (invalidSource) {
    return {
      status: "error",
      message: `Laporan ${invalidSource.reportNumber} tidak lagi aktif dan tidak bisa ditandai sebagai masalah berulang.`,
    };
  }

  const existingRecurrences = await prisma.reportRelation.findMany({
    where: { sourceReportId: { in: sourceReportIds }, relationType: "recurrence" },
    select: { sourceReportId: true },
  });

  if (existingRecurrences.length > 0) {
    const recurringSourceIds = new Set(
      existingRecurrences.map((relation) => relation.sourceReportId)
    );
    const relatedReport = sourceReports.find((report) =>
      recurringSourceIds.has(report.id)
    );

    return {
      status: "error",
      message: relatedReport
        ? `Laporan ${relatedReport.reportNumber} sudah ditandai sebagai masalah berulang.`
        : "Satu atau lebih laporan yang dipilih sudah ditandai sebagai masalah berulang.",
    };
  }

  try {
    await prisma.reportRelation.createMany({
      data: sourceReports.map((report) => ({
        sourceReportId: report.id,
        targetReportId,
        relationType: "recurrence" as ReportRelationType,
        note,
        createdBy: profile.id,
      })),
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menyimpan relasi laporan.",
    };
  }

  for (const sourceReport of sourceReports) {
    await createReportStatusLog({
      reportId: sourceReport.id,
      oldStatus: sourceReport.status,
      newStatus: sourceReport.status,
      note: `Laporan ditandai sebagai masalah berulang dari ${targetReport.reportNumber}. ${note}`,
      notifyReporter: false,
      notifyWhatsApp: false,
    });

    await notifyReporterRecurringIssue({
      sourceReportId: sourceReport.id,
      targetReportId,
      note,
    });
  }

  await createReportStatusLog({
    reportId: targetReportId,
    oldStatus: targetReport.status,
    newStatus: targetReport.status,
    note: `Masalah berulang bulk: ${sourceReports.length} laporan aktif ditautkan ke laporan selesai ini. ${note}`,
    notifyReporter: false,
    notifyWhatsApp: false,
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${targetReportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/village/reports");
  revalidatePath(`/dashboard/village/reports/${targetReportId}`);
  revalidatePath("/dashboard/public");
  revalidatePath("/dashboard/public/reports");

  for (const sourceReportId of sourceReportIds) {
    revalidatePath(`/dashboard/admin/reports/${sourceReportId}`);
    revalidatePath(`/dashboard/village/reports/${sourceReportId}`);
    revalidatePath(`/dashboard/public/reports/${sourceReportId}`);
  }

  return {
    status: "success",
    message: `${sourceReports.length} laporan aktif berhasil ditandai sebagai masalah berulang dari ${targetReport.reportNumber}.`,
  };
}

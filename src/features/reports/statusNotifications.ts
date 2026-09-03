import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@prisma/client";
import { sendReportStatusNotificationViaBrevo } from "@/src/lib/email/sendEmail";

async function createNotificationSafe(
  data: Prisma.NotificationUncheckedCreateInput,
  errorLabel: string
) {
  try {
    await prisma.notification.create({ data });
  } catch (error) {
    console.error(
      errorLabel,
      error instanceof Error ? error.message : error
    );
  }
}

type NotifyReporterStatusChangeParams = {
  reportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

const NOTIFIABLE_STATUSES = new Set([
  "need_verification",
  "rejected",
  "verified_valid",
  "verified_invalid",
//   "classified",
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
  "resolved",
  "archived",
  "merged",
]);

export async function notifyReporterStatusChange({
  reportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyReporterStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      reporterId: true,
      manualAddress: true,
      autoAddress: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!report) {
    console.error("Failed to fetch report for status notification: not found");
    return;
  }

  const reporter = await prisma.profile.findUnique({
    where: { id: report.reporterId },
    select: {
      id: true,
      fullName: true,
      email: true,
      notificationEmailEnabled: true,
    },
  });

  if (!reporter) {
    console.error("Failed to fetch reporter for status notification: not found");
    return;
  }

  if (reporter.notificationEmailEnabled === false) {
    return;
  }

  if (!reporter.email) {
    console.error("Reporter email is missing.");
    return;
  }

  const reportAddress =
    report.manualAddress ||
    report.autoAddress ||
    `Latitude ${report.latitude}, Longitude ${report.longitude}`;

  try {
    await sendReportStatusNotificationViaBrevo({
      reporterEmail: reporter.email,
      reporterName: reporter.fullName,
      reportNumber: report.reportNumber,
      reportTitle: report.title,
      oldStatus,
      newStatus,
      note,
      reportAddress,
    });

    await createNotificationSafe(
      {
        userId: reporter.id,
        reportId: report.id,
        recipientEmail: reporter.email,
        subject: `Update Status Laporan ${report.reportNumber}`,
        message:
          note ||
          `Status laporan ${report.reportNumber} telah diperbarui menjadi ${newStatus}.`,
        status: "sent",
        sentAt: new Date(),
        errorMessage: null,
      },
      "Failed to save sent notification:"
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to send report status notification.";

    console.error("Failed to send report status notification:", errorMessage);

    await createNotificationSafe(
      {
        userId: reporter.id,
        reportId: report.id,
        recipientEmail: reporter.email,
        subject: `Update Status Laporan ${report.reportNumber}`,
        message:
          note ||
          `Status laporan ${report.reportNumber} gagal dikirim melalui email.`,
        status: "failed",
        sentAt: null,
        errorMessage,
      },
      "Failed to save failed notification:"
    );
  }
}

type NotifyDuplicateReportersStatusChangeParams = {
  masterReportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

export async function notifyDuplicateReportersStatusChange({
  masterReportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyDuplicateReportersStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const masterReport = await prisma.report.findUnique({
    where: { id: masterReportId },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      manualAddress: true,
      autoAddress: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!masterReport) {
    console.error(
      "Failed to fetch master report for duplicate notification: not found"
    );
    return;
  }

  const relations = await prisma.reportRelation.findMany({
    where: { targetReportId: masterReportId, relationType: "duplicate" },
    select: { sourceReportId: true },
  });

  const sourceReportIds = Array.from(
    new Set(relations.map((relation) => relation.sourceReportId))
  );

  if (sourceReportIds.length === 0) {
    return;
  }

  const sourceReports = await prisma.report.findMany({
    where: { id: { in: sourceReportIds } },
    select: { id: true, reportNumber: true, title: true, reporterId: true },
  });

  const reporterIds = Array.from(
    new Set(sourceReports.map((sourceReport) => sourceReport.reporterId))
  );

  const reporters =
    reporterIds.length > 0
      ? await prisma.profile.findMany({
          where: { id: { in: reporterIds } },
          select: {
            id: true,
            fullName: true,
            email: true,
            notificationEmailEnabled: true,
          },
        })
      : [];

  const reporterById = new Map(
    reporters.map((reporter) => [reporter.id, reporter])
  );
  const reportAddress =
    masterReport.manualAddress ||
    masterReport.autoAddress ||
    `Latitude ${masterReport.latitude}, Longitude ${masterReport.longitude}`;

  for (const sourceReport of sourceReports) {
    const reporter = reporterById.get(sourceReport.reporterId);

    if (!reporter?.email || reporter.notificationEmailEnabled === false) {
      continue;
    }

    const duplicateNote = [
      `Laporan Anda (${sourceReport.reportNumber}) telah digabungkan dengan laporan utama ${masterReport.reportNumber}.`,
      note || "Status laporan utama telah diperbarui.",
    ].join(" ");

    try {
      await sendReportStatusNotificationViaBrevo({
        reporterEmail: reporter.email,
        reporterName: reporter.fullName,
        reportNumber: masterReport.reportNumber,
        reportTitle: masterReport.title,
        oldStatus,
        newStatus,
        note: duplicateNote,
        reportAddress,
      });

      await createNotificationSafe(
        {
          userId: reporter.id,
          reportId: sourceReport.id,
          recipientEmail: reporter.email,
          subject: `Update Status Laporan Utama ${masterReport.reportNumber}`,
          message: duplicateNote,
          status: "sent",
          sentAt: new Date(),
          errorMessage: null,
        },
        "Failed to save duplicate status notification:"
      );
    } catch (sendError) {
      const errorMessage =
        sendError instanceof Error
          ? sendError.message
          : "Failed to send duplicate report status notification.";

      console.error(
        "Failed to send duplicate report status notification:",
        errorMessage
      );

      await createNotificationSafe(
        {
          userId: reporter.id,
          reportId: sourceReport.id,
          recipientEmail: reporter.email,
          subject: `Update Status Laporan Utama ${masterReport.reportNumber}`,
          message: duplicateNote,
          status: "failed",
          sentAt: null,
          errorMessage,
        },
        "Failed to save failed duplicate status notification:"
      );
    }
  }
}

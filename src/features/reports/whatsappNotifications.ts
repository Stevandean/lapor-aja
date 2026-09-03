import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@prisma/client";
import { sendWhatsvaMessage } from "@/src/lib/whatsapp/whatsva";
import { buildReportStatusWhatsAppMessage } from "@/src/lib/whatsapp/templates";

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

type NotifyReporterWhatsAppStatusChangeParams = {
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
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
  "resolved",
  "archived",
  "merged",
]);

export async function notifyReporterWhatsAppStatusChange({
  reportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyReporterWhatsAppStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, reportNumber: true, title: true, reporterId: true },
  });

  if (!report) {
    console.error("Failed to fetch report for WhatsApp notification: not found");
    return;
  }

  const reporter = await prisma.profile.findUnique({
    where: { id: report.reporterId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      notificationWhatsappEnabled: true,
    },
  });

  if (!reporter) {
    console.error("Failed to fetch reporter for WhatsApp notification: not found");
    return;
  }

  if (reporter.notificationWhatsappEnabled === false) {
    return;
  }

  if (!reporter.phoneNumber) {
    console.error("Reporter phone number is missing.");
    return;
  }

  const message = buildReportStatusWhatsAppMessage({
    reporterName: reporter.fullName,
    reportNumber: report.reportNumber,
    reportTitle: report.title,
    oldStatus,
    newStatus,
    note,
  });

  try {
    const result = await sendWhatsvaMessage({
      phoneNumber: reporter.phoneNumber,
      message,
    });

    await createNotificationSafe(
      {
        userId: reporter.id,
        reportId: report.id,
        recipientEmail: reporter.email || null,
        recipientPhone: reporter.phoneNumber,
        subject: `WhatsApp Update Status Laporan ${report.reportNumber}`,
        message,
        status: "sent",
        sentAt: new Date(),
        errorMessage: null,
        channel: "whatsapp",
        provider: "whatsva",
        providerMessageId:
          result?.id || result?.message_id || result?.data?.id || null,
      },
      "Failed to save WhatsApp notification:"
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to send WhatsApp notification.";

    console.error("Failed to send WhatsApp notification:", errorMessage);

    await createNotificationSafe(
      {
        userId: reporter.id,
        reportId: report.id,
        recipientEmail: reporter.email || null,
        recipientPhone: reporter.phoneNumber,
        subject: `WhatsApp Update Status Laporan ${report.reportNumber}`,
        message,
        status: "failed",
        sentAt: null,
        errorMessage,
        channel: "whatsapp",
        provider: "whatsva",
        providerMessageId: null,
      },
      "Failed to save failed WhatsApp notification:"
    );
  }
}

type NotifyDuplicateReportersWhatsAppStatusChangeParams = {
  masterReportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

export async function notifyDuplicateReportersWhatsAppStatusChange({
  masterReportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyDuplicateReportersWhatsAppStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const masterReport = await prisma.report.findUnique({
    where: { id: masterReportId },
    select: { id: true, reportNumber: true, title: true },
  });

  if (!masterReport) {
    console.error(
      "Failed to fetch master report for duplicate WhatsApp notification: not found"
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
            phoneNumber: true,
            notificationWhatsappEnabled: true,
          },
        })
      : [];

  const reporterById = new Map(
    reporters.map((reporter) => [reporter.id, reporter])
  );

  for (const sourceReport of sourceReports) {
    const reporter = reporterById.get(sourceReport.reporterId);

    if (
      !reporter?.phoneNumber ||
      reporter.notificationWhatsappEnabled === false
    ) {
      continue;
    }

    const duplicateNote = [
      `Laporan Anda (${sourceReport.reportNumber}) telah digabungkan dengan laporan utama ${masterReport.reportNumber}.`,
      note || "Status laporan utama telah diperbarui.",
    ].join(" ");
    const message = buildReportStatusWhatsAppMessage({
      reporterName: reporter.fullName,
      reportNumber: masterReport.reportNumber,
      reportTitle: masterReport.title,
      oldStatus,
      newStatus,
      note: duplicateNote,
    });

    try {
      const result = await sendWhatsvaMessage({
        phoneNumber: reporter.phoneNumber,
        message,
      });

      await createNotificationSafe(
        {
          userId: reporter.id,
          reportId: sourceReport.id,
          recipientEmail: reporter.email || null,
          recipientPhone: reporter.phoneNumber,
          subject: `WhatsApp Update Status Laporan Utama ${masterReport.reportNumber}`,
          message,
          status: "sent",
          sentAt: new Date(),
          errorMessage: null,
          channel: "whatsapp",
          provider: "whatsva",
          providerMessageId:
            result?.id || result?.message_id || result?.data?.id || null,
        },
        "Failed to save duplicate WhatsApp notification:"
      );
    } catch (sendError) {
      const errorMessage =
        sendError instanceof Error
          ? sendError.message
          : "Failed to send duplicate report WhatsApp notification.";

      console.error(
        "Failed to send duplicate report WhatsApp notification:",
        errorMessage
      );

      await createNotificationSafe(
        {
          userId: reporter.id,
          reportId: sourceReport.id,
          recipientEmail: reporter.email || null,
          recipientPhone: reporter.phoneNumber,
          subject: `WhatsApp Update Status Laporan Utama ${masterReport.reportNumber}`,
          message,
          status: "failed",
          sentAt: null,
          errorMessage,
          channel: "whatsapp",
          provider: "whatsva",
          providerMessageId: null,
        },
        "Failed to save failed duplicate WhatsApp notification:"
      );
    }
  }
}

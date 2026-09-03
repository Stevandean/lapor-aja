import { revalidatePath } from "next/cache";
import { calculateEffectiveSlaStatus } from "@/src/lib/sla";
import { sendBrevoEmail } from "@/src/lib/email/brevo";
import { prisma } from "@/src/lib/prisma";
import type { Prisma, UserRole } from "@prisma/client";
import { sendWhatsvaMessage } from "@/src/lib/whatsapp/whatsva";

type SlaAlertType = "at_risk" | "critical" | "overdue";

type SlaAlertReport = {
  id: string;
  report_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  resolution_due_at: string | null;
  resolved_at: string | null;
  manual_address: string | null;
  auto_address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type StaffRecipient = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  role: string;
  notification_internal_enabled?: boolean | null;
  notification_email_enabled?: boolean | null;
  notification_whatsapp_enabled?: boolean | null;
};

type SendSlaAlertNotificationsParams = {
  triggeredBy?: string | null;
};

type NotificationPayload = {
  userId: string;
  reportId: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  subject: string;
  message: string;
  channel: "internal" | "email" | "whatsapp";
  status: "sent" | "failed";
  provider?: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
};

const ALERT_RECIPIENT_ROLES: UserRole[] = ["admin", "kepala_desa", "sekdes"];

export async function sendSlaAlertNotifications({
  triggeredBy = null,
}: SendSlaAlertNotificationsParams = {}) {
  let reportRows;
  let recipientRows;

  try {
    [reportRows, recipientRows] = await Promise.all([
      prisma.report.findMany({
        where: { resolutionDueAt: { not: null } },
        select: {
          id: true,
          reportNumber: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          resolutionDueAt: true,
          resolvedAt: true,
          manualAddress: true,
          autoAddress: true,
          latitude: true,
          longitude: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      prisma.profile.findMany({
        where: { role: { in: ALERT_RECIPIENT_ROLES }, isActive: true },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          notificationInternalEnabled: true,
          notificationEmailEnabled: true,
          notificationWhatsappEnabled: true,
        },
      }),
    ]);
  } catch (error) {
    return {
      status: "error" as const,
      message: error instanceof Error ? error.message : "Gagal memuat data alert SLA.",
      processed: 0,
      skipped: 0,
      failed: 0,
    };
  }

  const reportRowsMapped: SlaAlertReport[] = reportRows.map((report) => ({
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    priority: report.priority,
    created_at: report.createdAt.toISOString(),
    resolution_due_at: report.resolutionDueAt?.toISOString() ?? null,
    resolved_at: report.resolvedAt?.toISOString() ?? null,
    manual_address: report.manualAddress,
    auto_address: report.autoAddress,
    latitude: report.latitude ? Number(report.latitude) : null,
    longitude: report.longitude ? Number(report.longitude) : null,
  }));

  const recipients: StaffRecipient[] = recipientRows.map((recipient) => ({
    id: recipient.id,
    full_name: recipient.fullName,
    email: recipient.email,
    phone_number: recipient.phoneNumber,
    role: recipient.role,
    notification_internal_enabled: recipient.notificationInternalEnabled,
    notification_email_enabled: recipient.notificationEmailEnabled,
    notification_whatsapp_enabled: recipient.notificationWhatsappEnabled,
  }));

  const alertReports = reportRowsMapped
    .map((report) => ({
      report,
      alertType: calculateEffectiveSlaStatus(report),
    }))
    .filter(
      (item): item is { report: SlaAlertReport; alertType: SlaAlertType } =>
        item.alertType === "at_risk" ||
        item.alertType === "critical" ||
        item.alertType === "overdue"
    );

  if (alertReports.length === 0) {
    return {
      status: "success" as const,
      message: "Tidak ada laporan SLA yang berisiko atau melewati tenggat.",
      processed: 0,
      skipped: 0,
      failed: 0,
    };
  }

  if (recipients.length === 0) {
    return {
      status: "success" as const,
      message:
        "Alert SLA ditemukan, tetapi belum ada penerima petugas yang aktif.",
      processed: 0,
      skipped: alertReports.length,
      failed: 0,
    };
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const { report, alertType } of alertReports) {
    const lockResult = await createSlaAlertLock({
      reportId: report.id,
      alertType,
      triggeredBy,
    });

    if (lockResult === "duplicate") {
      skipped += 1;
      continue;
    }

    if (lockResult === "error") {
      failed += 1;
      continue;
    }

    const alertMessage = buildSlaAlertMessage(report, alertType);
    const alertSubject = buildSlaAlertSubject(report, alertType);

    for (const recipient of recipients) {
      if (recipient.notification_internal_enabled !== false) {
        await createNotificationRecord({
          userId: recipient.id,
          reportId: report.id,
          recipientEmail: recipient.email,
          subject: alertSubject,
          message: alertMessage,
          channel: "internal",
          status: "sent",
        });
      }

      if (recipient.email && recipient.notification_email_enabled !== false) {
        await sendSlaEmailNotification({
          recipient,
          report,
          alertType,
          subject: alertSubject,
          message: alertMessage,
        });
      }

      if (
        recipient.phone_number &&
        recipient.notification_whatsapp_enabled !== false
      ) {
        await sendSlaWhatsAppNotification({
          recipient,
          report,
          alertType,
          subject: alertSubject,
          message: alertMessage,
        });
      }
    }

    processed += 1;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/village/sla");

  return {
    status: failed > 0 ? ("error" as const) : ("success" as const),
    message:
      failed > 0
        ? `Alert SLA selesai dengan ${failed} laporan gagal dikirim.`
        : `Alert SLA terkirim untuk ${processed} laporan. ${skipped} alert duplikat dilewati.`,
    processed,
    skipped,
    failed,
  };
}

async function createSlaAlertLock({
  reportId,
  alertType,
  triggeredBy,
}: {
  reportId: string;
  alertType: SlaAlertType;
  triggeredBy: string | null;
}) {
  try {
    await prisma.reportSlaAlertNotification.create({
      data: {
        reportId,
        alertType,
        triggeredBy,
      },
    });

    return "created" as const;
  } catch (error) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;

    if (prismaError?.code === "P2002") {
      return "duplicate" as const;
    }

    console.error(
      "Failed to create SLA alert lock:",
      error instanceof Error ? error.message : error
    );
    return "error" as const;
  }
}

async function sendSlaEmailNotification({
  recipient,
  report,
  alertType,
  subject,
  message,
}: {
  recipient: StaffRecipient;
  report: SlaAlertReport;
  alertType: SlaAlertType;
  subject: string;
  message: string;
}) {
  try {
    await sendBrevoEmail({
      to: recipient.email || "",
      toName: recipient.full_name || recipient.email || "Petugas Desa",
      subject,
      htmlContent: buildSlaEmailHtml({
        recipientName: recipient.full_name || "Petugas Desa",
        report,
        alertType,
        message,
      }),
      textContent: buildSlaEmailText({
        recipientName: recipient.full_name || "Petugas Desa",
        report,
        alertType,
        message,
      }),
    });

    await createNotificationRecord({
      userId: recipient.id,
      reportId: report.id,
      recipientEmail: recipient.email,
      subject,
      message,
      channel: "email",
      status: "sent",
      provider: "brevo",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Gagal mengirim email SLA.";

    console.error("Failed to send SLA email notification:", errorMessage);

    await createNotificationRecord({
      userId: recipient.id,
      reportId: report.id,
      recipientEmail: recipient.email,
      subject,
      message,
      channel: "email",
      status: "failed",
      provider: "brevo",
      errorMessage,
    });
  }
}

async function sendSlaWhatsAppNotification({
  recipient,
  report,
  subject,
  message,
}: {
  recipient: StaffRecipient;
  report: SlaAlertReport;
  alertType: SlaAlertType;
  subject: string;
  message: string;
}) {
  try {
    const result = await sendWhatsvaMessage({
      phoneNumber: recipient.phone_number || "",
      message,
    });

    await createNotificationRecord({
      userId: recipient.id,
      reportId: report.id,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone_number,
      subject,
      message,
      channel: "whatsapp",
      status: "sent",
      provider: "whatsva",
      providerMessageId:
        result?.id || result?.message_id || result?.data?.id || null,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Gagal mengirim WhatsApp SLA.";

    console.error("Failed to send SLA WhatsApp notification:", errorMessage);

    await createNotificationRecord({
      userId: recipient.id,
      reportId: report.id,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone_number,
      subject,
      message,
      channel: "whatsapp",
      status: "failed",
      provider: "whatsva",
      errorMessage,
    });
  }
}

async function createNotificationRecord({
  userId,
  reportId,
  recipientEmail,
  recipientPhone,
  subject,
  message,
  channel,
  status,
  provider = null,
  providerMessageId = null,
  errorMessage = null,
}: NotificationPayload) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        reportId,
        recipientEmail: recipientEmail || "",
        recipientPhone: recipientPhone || null,
        subject,
        message,
        status,
        sentAt: status === "sent" ? new Date() : null,
        errorMessage,
        channel,
        provider,
        providerMessageId,
      },
    });
  } catch (error) {
    console.error(
      "Failed to create SLA notification record:",
      error instanceof Error ? error.message : error
    );
  }
}

function buildSlaAlertSubject(report: SlaAlertReport, alertType: SlaAlertType) {
  return `${getSlaAlertLabel(alertType)} SLA ${report.report_number}`;
}

function buildSlaAlertMessage(report: SlaAlertReport, alertType: SlaAlertType) {
  return [
    `${getSlaAlertLabel(alertType)}: laporan ${report.report_number} (${report.title}).`,
    `Deadline resolusi: ${
      report.resolution_due_at ? formatDateTime(report.resolution_due_at) : "-"
    }.`,
    `Prioritas: ${formatEnum(report.priority)}.`,
    `Lokasi: ${getReportAddress(report)}.`,
  ].join(" ");
}

function buildSlaEmailHtml({
  recipientName,
  report,
  alertType,
  message,
}: {
  recipientName: string;
  report: SlaAlertReport;
  alertType: SlaAlertType;
  message: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;">
      <p>Halo ${escapeHtml(recipientName)},</p>
      <p>${escapeHtml(message)}</p>
      <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p><strong>Status SLA:</strong> ${escapeHtml(getSlaAlertLabel(alertType))}</p>
        <p><strong>Nomor Laporan:</strong> ${escapeHtml(report.report_number)}</p>
        <p><strong>Judul:</strong> ${escapeHtml(report.title)}</p>
        <p><strong>Prioritas:</strong> ${escapeHtml(formatEnum(report.priority))}</p>
        <p><strong>Deadline Resolusi:</strong> ${escapeHtml(report.resolution_due_at ? formatDateTime(report.resolution_due_at) : "-")}</p>
        <p><strong>Lokasi:</strong> ${escapeHtml(getReportAddress(report))}</p>
      </div>
      <p>Mohon segera lakukan pengecekan pada dashboard SLA Monitoring.</p>
      <p>Hormat kami,<br /><strong>Sistem Lapor Aja</strong></p>
    </div>
  `;
}

function buildSlaEmailText({
  recipientName,
  report,
  alertType,
  message,
}: {
  recipientName: string;
  report: SlaAlertReport;
  alertType: SlaAlertType;
  message: string;
}) {
  return `
Halo ${recipientName},

${message}

Status SLA: ${getSlaAlertLabel(alertType)}
Nomor Laporan: ${report.report_number}
Judul: ${report.title}
Prioritas: ${formatEnum(report.priority)}
Deadline Resolusi: ${report.resolution_due_at ? formatDateTime(report.resolution_due_at) : "-"}
Lokasi: ${getReportAddress(report)}

Mohon segera lakukan pengecekan pada dashboard SLA Monitoring.
  `.trim();
}

function getSlaAlertLabel(alertType: SlaAlertType) {
  if (alertType === "overdue") {
    return "Melewati Tenggat";
  }

  if (alertType === "critical") {
    return "Kritis";
  }

  return "Berisiko";
}

function getReportAddress(report: SlaAlertReport) {
  return (
    report.manual_address ||
    report.auto_address ||
    (report.latitude && report.longitude
      ? `Latitude ${report.latitude}, Longitude ${report.longitude}`
      : "-")
  );
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatEnum(value: string) {
  const labels: Record<string, string> = {
    darurat: "Darurat",
    tinggi: "Tinggi",
    sedang: "Sedang",
    rendah: "Rendah",
    pending: "Menunggu Review",
    need_verification: "Perlu Verifikasi",
    verified_valid: "Terverifikasi Valid",
    verified_invalid: "Terverifikasi Tidak Valid",
    classified: "Diklasifikasi",
    handled_by_village: "Ditangani Desa",
    forwarded_to_agency: "Diteruskan ke Instansi",
    waiting_budget: "Menunggu Anggaran",
    in_progress: "Diproses",
    resolved: "Selesai",
    rejected: "Ditolak",
    archived: "Diarsipkan",
    merged: "Digabungkan",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

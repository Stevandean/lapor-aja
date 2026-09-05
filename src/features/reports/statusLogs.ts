import { revalidatePath } from "next/cache";
import { getProfile } from "@/src/lib/auth/getProfile";
import { prisma } from "@/src/lib/prisma";
import type { ReportStatus } from "@prisma/client";
import {
  notifyDuplicateReportersStatusChange,
  notifyReporterStatusChange,
} from "@/src/features/reports/statusNotifications";
import {
  notifyDuplicateReportersWhatsAppStatusChange,
  notifyReporterWhatsAppStatusChange,
} from "@/src/features/reports/whatsappNotifications";
import {
  notifyDuplicateReportersInternalStatusChange,
  notifyReporterInternalStatusChange,
} from "@/src/features/reports/internalNotifications";

type CreateStatusLogParams = {
  reportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
  notifyReporter?: boolean;
  notifyWhatsApp?: boolean;
  // Cabang 4a: dipakai oleh pemanggil TANPA sesi login (mis. sweep alert
  // SLA lewat cron `/api/notifications/sla-alerts`, yang otorisasinya
  // pakai bearer secret, bukan sesi NextAuth). Kalau diisi, dipakai
  // langsung sebagai `changedBy` dan TIDAK bergantung pada `getProfile()`
  // — tanpa ini, log alert yang dipicu cron akan senyap tidak tersimpan
  // sama sekali karena `getProfile()` pasti null di konteks itu.
  changedBy?: string | null;
};

export async function createReportStatusLog({
  reportId,
  oldStatus = null,
  newStatus,
  note = null,
  notifyReporter = true,
  notifyWhatsApp = true,
  changedBy,
}: CreateStatusLogParams) {
  let resolvedChangedBy: string | null;

  if (changedBy !== undefined) {
    resolvedChangedBy = changedBy;
  } else {
    const profile = await getProfile();

    if (!profile) {
      return;
    }

    resolvedChangedBy = profile.id;
  }

  try {
    await prisma.reportStatusLog.create({
      data: {
        reportId,
        oldStatus: oldStatus as ReportStatus | null,
        newStatus: newStatus as ReportStatus,
        changedBy: resolvedChangedBy,
        note,
      },
    });
  } catch (error) {
    console.error(
      "Failed to create report status log:",
      error instanceof Error ? error.message : error
    );
    return;
  }

  if (notifyReporter) {
    await notifyReporterInternalStatusChange({
      reportId,
      oldStatus,
      newStatus,
      note,
    });

    await notifyDuplicateReportersInternalStatusChange({
      masterReportId: reportId,
      oldStatus,
      newStatus,
      note,
    });

    revalidatePath("/dashboard/public");
  }

  if (notifyReporter) {
    await notifyReporterStatusChange({
      reportId,
      oldStatus,
      newStatus,
      note,
    });

    await notifyDuplicateReportersStatusChange({
      masterReportId: reportId,
      oldStatus,
      newStatus,
      note,
    });
  }
  if (notifyWhatsApp) {
    await notifyReporterWhatsAppStatusChange({
      reportId,
      oldStatus,
      newStatus,
      note,
    });

    await notifyDuplicateReportersWhatsAppStatusChange({
      masterReportId: reportId,
      oldStatus,
      newStatus,
      note,
    });
  }
}

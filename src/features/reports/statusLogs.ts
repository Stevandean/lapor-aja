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
};

export async function createReportStatusLog({
  reportId,
  oldStatus = null,
  newStatus,
  note = null,
  notifyReporter = true,
  notifyWhatsApp = true,
}: CreateStatusLogParams) {
  const profile = await getProfile();

  if (!profile) {
    return;
  }

  try {
    await prisma.reportStatusLog.create({
      data: {
        reportId,
        oldStatus: oldStatus as ReportStatus | null,
        newStatus: newStatus as ReportStatus,
        changedBy: profile.id,
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

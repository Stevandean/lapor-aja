import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { UserRole } from "@prisma/client";

type NotificationReport = {
  id: string;
  report_number: string;
  title: string;
  reporter_id: string | null;
};

type NotificationProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  notification_internal_enabled?: boolean | null;
};

type CreateInternalNotificationParams = {
  userId: string;
  recipientEmail: string | null;
  reportId: string;
  subject: string;
  message: string;
};

type NotifyReporterInternalStatusChangeParams = {
  reportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

type NotifyDuplicateReportersInternalStatusChangeParams = {
  masterReportId: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

type NotifyReporterRelationParams = {
  sourceReportId: string;
  targetReportId: string;
  note?: string | null;
};

type NotifyUsersInternalParams = {
  userIds: string[];
  reportId: string;
  subject: string;
  message: string;
};

type NotifyRoleInternalParams = {
  roles: string[];
  reportId: string;
  subject: string;
  message: string;
};

type NotifyHamletHeadsParams = {
  hamletId: string;
  reportId: string;
  reportNumber: string;
  reportTitle: string;
};

type NotifySectionKasiParams = {
  sectionId: string;
  reportId: string;
  reportNumber: string;
  reportTitle: string;
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

export async function notifyReporterInternalStatusChange({
  reportId,
  newStatus,
  note = null,
}: NotifyReporterInternalStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const report = await getReportById(reportId);

  if (!report?.reporter_id) {
    return;
  }

  const reporter = await getProfileById(report.reporter_id);

  if (!reporter) {
    return;
  }

  if (reporter.notification_internal_enabled === false) {
    return;
  }

  await createInternalNotification({
    userId: reporter.id,
    recipientEmail: reporter.email,
    reportId: report.id,
    subject: `Update laporan ${report.report_number}`,
    message:
      note ||
      `Status laporan ${report.report_number} telah diperbarui menjadi ${formatStatus(newStatus)}.`,
  });
}

export async function notifyDuplicateReportersInternalStatusChange({
  masterReportId,
  oldStatus = null,
  newStatus,
  note = null,
}: NotifyDuplicateReportersInternalStatusChangeParams) {
  if (!NOTIFIABLE_STATUSES.has(newStatus)) {
    return;
  }

  const masterReport = await getReportById(masterReportId);

  if (!masterReport) {
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

  const sourceReportRows = await prisma.report.findMany({
    where: { id: { in: sourceReportIds } },
    select: { id: true, reportNumber: true, title: true, reporterId: true },
  });
  const sourceReports = sourceReportRows.map((row) => ({
    id: row.id,
    report_number: row.reportNumber,
    title: row.title,
    reporter_id: row.reporterId,
  }));

  const reporterIds = Array.from(
    new Set(
      sourceReports
        .map((sourceReport) => sourceReport.reporter_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const reportersById = await getProfilesById(reporterIds);
  const statusText =
    oldStatus && oldStatus !== newStatus
      ? `${formatStatus(oldStatus)} ke ${formatStatus(newStatus)}`
      : formatStatus(newStatus);

  for (const sourceReport of sourceReports) {
    const reporter = sourceReport.reporter_id
      ? reportersById.get(sourceReport.reporter_id)
      : null;

    if (!reporter) {
      continue;
    }

    if (reporter.notification_internal_enabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: reporter.id,
      recipientEmail: reporter.email,
      reportId: sourceReport.id,
      subject: `Update laporan utama ${masterReport.report_number}`,
      message: [
        `Laporan Anda (${sourceReport.report_number}) telah digabungkan ke laporan utama ${masterReport.report_number}.`,
        `Status laporan utama diperbarui: ${statusText}.`,
        note || null,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }
}

export async function notifyReporterRecurringIssue({
  sourceReportId,
  targetReportId,
  note = null,
}: NotifyReporterRelationParams) {
  const sourceReport = await getReportById(sourceReportId);
  const targetReport = await getReportById(targetReportId);

  if (!sourceReport?.reporter_id || !targetReport) {
    return;
  }

  const reporter = await getProfileById(sourceReport.reporter_id);

  if (!reporter) {
    return;
  }

  if (reporter.notification_internal_enabled === false) {
    return;
  }

  await createInternalNotification({
    userId: reporter.id,
    recipientEmail: reporter.email,
    reportId: sourceReport.id,
    subject: `Laporan berulang ${sourceReport.report_number}`,
    message: [
      `Laporan Anda (${sourceReport.report_number}) ditandai sebagai masalah berulang dari laporan ${targetReport.report_number}.`,
      note || null,
    ]
      .filter(Boolean)
      .join(" "),
  });
}

export async function notifyUsersInternal({
  userIds,
  reportId,
  subject,
  message,
}: NotifyUsersInternalParams) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  const profilesById = await getProfilesById(uniqueUserIds);

  for (const userId of uniqueUserIds) {
    const profile = profilesById.get(userId);

    if (!profile) {
      continue;
    }

    if (profile.notification_internal_enabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: profile.id,
      recipientEmail: profile.email,
      reportId,
      subject,
      message,
    });
  }
}

export async function notifyRoleInternal({
  roles,
  reportId,
  subject,
  message,
}: NotifyRoleInternalParams) {
  const uniqueRoles = Array.from(new Set(roles.filter(Boolean)));

  if (uniqueRoles.length === 0) {
    return;
  }

  let profiles: { id: string; fullName: string | null; email: string | null; notificationInternalEnabled: boolean }[];

  try {
    profiles = await prisma.profile.findMany({
      where: {
        role: { in: uniqueRoles as UserRole[] },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        notificationInternalEnabled: true,
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch role notification recipients:",
      error instanceof Error ? error.message : error
    );
    return;
  }

  for (const profile of profiles) {
    if (profile.notificationInternalEnabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: profile.id,
      recipientEmail: profile.email,
      reportId,
      subject,
      message,
    });
  }
}

export async function notifyHamletHeadsForVerification({
  hamletId,
  reportId,
  reportNumber,
  reportTitle,
}: NotifyHamletHeadsParams) {
  let profiles: { id: string; email: string | null; notificationInternalEnabled: boolean }[];

  try {
    profiles = await prisma.profile.findMany({
      where: { role: "kepala_dusun", dusunId: hamletId, isActive: true },
      select: { id: true, email: true, notificationInternalEnabled: true },
    });
  } catch (error) {
    console.error(
      "Failed to fetch hamlet head recipients:",
      error instanceof Error ? error.message : error
    );
    return;
  }

  for (const profile of profiles) {
    if (profile.notificationInternalEnabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: profile.id,
      recipientEmail: profile.email,
      reportId,
      subject: `Verifikasi baru ${reportNumber}`,
      message: `Laporan ${reportNumber} (${reportTitle}) perlu diverifikasi di wilayah dusun Anda.`,
    });
  }
}

export async function notifySectionKasiAssignment({
  sectionId,
  reportId,
  reportNumber,
  reportTitle,
}: NotifySectionKasiParams) {
  let profiles: { id: string; email: string | null; notificationInternalEnabled: boolean }[];

  try {
    profiles = await prisma.profile.findMany({
      where: { role: "kasi", sectionId, isActive: true },
      select: { id: true, email: true, notificationInternalEnabled: true },
    });
  } catch (error) {
    console.error(
      "Failed to fetch Kasi recipients:",
      error instanceof Error ? error.message : error
    );
    return;
  }

  for (const profile of profiles) {
    if (profile.notificationInternalEnabled === false) {
      continue;
    }

    await createInternalNotification({
      userId: profile.id,
      recipientEmail: profile.email,
      reportId,
      subject: `Laporan baru ditugaskan ${reportNumber}`,
      message: `Laporan ${reportNumber} (${reportTitle}) telah ditugaskan ke seksi Anda.`,
    });
  }
}

async function getReportById(reportId: string) {
  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, reportNumber: true, title: true, reporterId: true },
    });

    if (!report) {
      return null;
    }

    return {
      id: report.id,
      report_number: report.reportNumber,
      title: report.title,
      reporter_id: report.reporterId,
    } as NotificationReport;
  } catch (error) {
    console.error(
      "Failed to fetch report for internal notification:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

async function getProfileById(profileId: string) {
  const profiles = await getProfilesById([profileId]);

  return profiles.get(profileId) ?? null;
}

async function getProfilesById(profileIds: string[]) {
  const profilesById = new Map<string, NotificationProfile>();

  if (profileIds.length === 0) {
    return profilesById;
  }

  try {
    const rows = await prisma.profile.findMany({
      where: { id: { in: profileIds } },
      select: {
        id: true,
        fullName: true,
        email: true,
        notificationInternalEnabled: true,
      },
    });

    for (const row of rows) {
      profilesById.set(row.id, {
        id: row.id,
        full_name: row.fullName,
        email: row.email,
        notification_internal_enabled: row.notificationInternalEnabled,
      });
    }
  } catch (error) {
    console.error(
      "Failed to fetch profiles for internal notifications:",
      error instanceof Error ? error.message : error
    );
  }

  return profilesById;
}

async function createInternalNotification({
  userId,
  recipientEmail,
  reportId,
  subject,
  message,
}: CreateInternalNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        reportId,
        recipientEmail: recipientEmail || "",
        subject,
        message,
        status: "sent",
        sentAt: new Date(),
        errorMessage: null,
        channel: "internal",
        provider: null,
        providerMessageId: null,
      },
    });

    revalidatePath("/dashboard");
  } catch (error) {
    console.error(
      "Failed to create internal notification:",
      error instanceof Error ? error.message : error
    );
  }
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
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

  return labels[status] ?? status.replaceAll("_", " ");
}

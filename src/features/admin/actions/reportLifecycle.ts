"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { ReportPriority } from "@prisma/client";
import type { ActionState } from "@/src/types/action";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import { notifyHamletHeadsForVerification } from "@/src/features/reports/internalNotifications";
import { calculateBusinessAwareDueDate, toUtcDateKey } from "@/src/lib/sla";
import { requireAdmin } from "./shared";

export async function approveReportForVerification(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");
  const categoryId = String(formData.get("category_id") || "");
  const hamletId = String(formData.get("dusun_id") || "");
  const priority = String(formData.get("priority") || "").trim();
  const adminNote = String(formData.get("admin_note") || "").trim();

  if (!reportId || !categoryId || !hamletId) {
    return {
      status: "error",
      message: "Lengkapi kategori dan dusun sebelum menyetujui laporan.",
    };
  }

  if (!priority) {
    return {
      status: "error",
      message: "Prioritas wajib dipilih.",
    };
  }

  // Cabang 1b: override per kategori MENGGANTIKAN MUTLAK aturan priority
  // kalau ada baris untuk kategori ini — priority tetap wajib dipilih
  // (dipakai untuk klasifikasi laporan), tapi tidak dipakai untuk durasi
  // SLA sama sekali selama override ada.
  const categoryThreshold = await prisma.slaCategoryThreshold.findUnique({
    where: { categoryId },
    select: { verificationHours: true, resolutionHours: true },
  });

  let verificationHours: number;
  let resolutionHours: number;
  let durationSourceNote: string;

  if (categoryThreshold) {
    verificationHours = categoryThreshold.verificationHours;
    resolutionHours = categoryThreshold.resolutionHours;
    durationSourceNote = "berdasarkan ambang batas khusus kategori laporan";
  } else {
    const slaRule = await prisma.slaRule.findFirst({
      where: { priority: priority as ReportPriority, isActive: true },
      select: { verificationHours: true, resolutionHours: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!slaRule) {
      return {
        status: "error",
        message:
          "Prioritas yang dipilih tidak tersedia. Pilih prioritas SLA yang aktif.",
      };
    }

    verificationHours = slaRule.verificationHours;
    resolutionHours = slaRule.resolutionHours;
    durationSourceNote = `untuk prioritas ${priority}`;
  }

  // Cabang 1c: tenggat dihitung dengan melompati akhir pekan & hari libur
  // nasional, bukan lagi `now + jam` mentah.
  const holidays = await prisma.nationalHoliday.findMany({
    select: { date: true },
  });
  const holidayDateKeys = new Set(holidays.map((holiday) => toUtcDateKey(holiday.date)));

  const now = new Date();

  const verificationDueAt = calculateBusinessAwareDueDate(
    now,
    verificationHours,
    holidayDateKeys
  );

  const resolutionDueAt = calculateBusinessAwareDueDate(
    now,
    resolutionHours,
    holidayDateKeys
  );

  let approvedReport: { id: string; reportNumber: string; title: string };

  try {
    approvedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        categoryId,
        dusunId: hamletId,
        priority: priority as ReportPriority,
        adminNote: adminNote || null,
        status: "need_verification",
        verificationDueAt,
        resolutionDueAt,
        slaStatus: "on_time",
      },
      select: { id: true, reportNumber: true, title: true },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menyetujui laporan.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "pending",
    newStatus: "need_verification",
    note: "Laporan disetujui admin dan dikirim untuk verifikasi dusun.",
  });

  await recordSlaEvent({
    reportId,
    eventType: "deadline_started",
    newResolutionDueAt: resolutionDueAt.toISOString(),
    note: `SLA dimulai ${durationSourceNote}.`,
  });

  await notifyHamletHeadsForVerification({
    hamletId,
    reportId,
    reportNumber: approvedReport.reportNumber,
    reportTitle: approvedReport.title,
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);

  return {
    status: "success",
    message: "Laporan disetujui dan dikirim ke tahap verifikasi.",
  };
}

export async function rejectReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");
  const rejectionReason = String(formData.get("rejection_reason") || "").trim();

  if (!reportId || !rejectionReason) {
    return {
      status: "error",
      message: "Isi alasan penolakan terlebih dahulu.",
    };
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "rejected",
        slaStatus: "completed",
        rejectionReason,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menolak laporan.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "pending",
    newStatus: "rejected",
    note: rejectionReason || "Laporan ditolak oleh admin.",
  });

  await recordSlaEvent({
    reportId,
    eventType: "completed",
    note: "SLA selesai karena laporan ditolak.",
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);

  return {
    status: "success",
    message: "Laporan berhasil ditolak.",
  };
}

export async function startReportProgress(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      status: "forwarded_to_agency",
      followUpType: "diteruskan_ke_dinas",
    },
    select: { id: true, status: true },
  });

  if (!report) {
    return {
      status: "error",
      message:
        "Admin hanya bisa memulai laporan yang diteruskan ke instansi luar.",
    };
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "in_progress" },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memulai laporan.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "in_progress",
    note: "Penanganan laporan sudah dimulai.",
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/follow-up");

  return {
    status: "success",
    message: "Laporan berhasil ditandai sedang diproses.",
  };
}

export async function resolveReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      status: "in_progress",
      followUpType: "diteruskan_ke_dinas",
    },
    select: { id: true, status: true, followUpType: true },
  });

  if (!report) {
    return {
      status: "error",
      message:
        "Admin hanya bisa menyelesaikan laporan instansi luar yang sedang diproses.",
    };
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "resolved",
        slaStatus: "completed",
        resolvedAt: new Date(),
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menyelesaikan laporan.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "in_progress",
    newStatus: "resolved",
    note: "Laporan sudah diselesaikan.",
  });

  await recordSlaEvent({
    reportId,
    eventType: "completed",
    note: "SLA selesai karena laporan sudah diselesaikan.",
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/follow-up");

  return {
    status: "success",
    message: "Laporan berhasil diselesaikan.",
  };
}

export async function archiveReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      status: { in: ["resolved", "rejected", "verified_invalid"] },
    },
    select: { id: true, status: true },
  });

  if (!report) {
    return {
      status: "error",
      message:
        "Hanya laporan selesai, ditolak, atau tidak valid yang bisa diarsipkan.",
    };
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "archived",
        slaStatus: "completed",
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal mengarsipkan laporan.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "archived",
    note: "Laporan sudah diarsipkan.",
  });

  await recordSlaEvent({
    reportId,
    eventType: "completed",
    note: "SLA selesai karena laporan diarsipkan.",
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/archive");
  revalidatePath("/dashboard/admin/follow-up");

  return {
    status: "success",
    message: "Laporan berhasil diarsipkan.",
  };
}

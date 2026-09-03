"use server";

import { revalidatePath } from "next/cache";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { notifyRoleInternal } from "@/src/features/reports/internalNotifications";
import {
  requireKasi,
  getAssignedReport,
  getProgressPhotos,
  validateProgressPhotos,
  saveProgressUpdate,
  reportHasProgressUpdates,
  revalidateKasiReport,
} from "./shared";

async function reportHasBudgetRequests(reportId: string) {
  const count = await prisma.reportBudgetRequest.count({
    where: { reportId },
  });

  return count > 0;
}

export async function returnKasiReportAssignment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      status: "error",
      message: "Akun Anda belum ditautkan ke seksi desa.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const note = String(formData.get("note") || "").trim();

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Jelaskan alasan laporan ini perlu dikembalikan ke admin.",
    };
  }

  const report = await getAssignedReport(reportId, profile.section_id);

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  if (!["handled_by_village", "waiting_budget"].includes(report.status)) {
    return {
      status: "error",
      message: "Hanya laporan yang baru ditugaskan yang bisa dikembalikan ke admin.",
    };
  }

  const [hasProgressUpdates, hasBudgetRequests] = await Promise.all([
    reportHasProgressUpdates(reportId),
    reportHasBudgetRequests(reportId),
  ]);

  if (hasProgressUpdates || hasBudgetRequests) {
    return {
      status: "error",
      message:
        "Laporan ini sudah memiliki aktivitas progres atau anggaran sehingga tidak bisa dikembalikan.",
    };
  }

  const { count } = await prisma.report.updateMany({
    where: {
      id: reportId,
      assignedSectionId: profile.section_id,
      status: { in: ["handled_by_village", "waiting_budget"] },
    },
    data: {
      status: "verified_valid",
      assignedSectionId: null,
      internalHandlingNote: note,
    },
  });

  if (count === 0) {
    return {
      status: "error",
      message: "Laporan tidak bisa dikembalikan karena penugasannya sudah berubah.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "verified_valid",
    note: `Dikembalikan oleh Kasi untuk penugasan ulang: ${note}`,
    notifyReporter: false,
    notifyWhatsApp: false,
  });

  await notifyRoleInternal({
    roles: ["admin"],
    reportId,
    subject: `Laporan dikembalikan ${report.report_number}`,
    message: `Kasi mengembalikan laporan ${report.report_number} (${report.title}) untuk penugasan ulang. Catatan: ${note}`,
  });

  revalidateKasiReport(reportId);
  revalidatePath("/dashboard/admin/asset-classification");
  revalidatePath(`/dashboard/admin/asset-classification/${reportId}`);

  return {
    status: "success",
    message: "Laporan berhasil dikembalikan ke admin untuk penugasan ulang.",
  };
}

export async function startKasiReportProgress(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      status: "error",
      message: "Akun Anda belum ditautkan ke seksi desa.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const note = String(formData.get("note") || "").trim();

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Tulis catatan singkat penanganan sebelum memulai progres.",
    };
  }

  const report = await getAssignedReport(reportId, profile.section_id);

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  if (report.status !== "handled_by_village") {
    return {
      status: "error",
      message: "Hanya laporan yang ditangani desa yang bisa dimulai.",
    };
  }

  if (await reportHasProgressUpdates(reportId)) {
    const { count: repairCount } = await prisma.report.updateMany({
      where: {
        id: reportId,
        assignedSectionId: profile.section_id,
        status: "handled_by_village",
      },
      data: { status: "in_progress" },
    });

    if (repairCount === 0) {
      return {
        status: "error",
        message: "Laporan ini sudah dimulai atau tidak lagi tersedia untuk dimulai.",
      };
    }

    revalidateKasiReport(reportId);

    return {
      status: "success",
      message: "Penanganan laporan sudah sedang diproses.",
    };
  }

  const { count } = await prisma.report.updateMany({
    where: {
      id: reportId,
      assignedSectionId: profile.section_id,
      status: "handled_by_village",
    },
    data: {
      status: "in_progress",
      internalHandlingNote: note,
    },
  });

  if (count === 0) {
    return {
      status: "error",
      message: "Laporan ini sudah dimulai atau tidak lagi tersedia untuk dimulai.",
    };
  }

  const saveResult = await saveProgressUpdate({
    reportId,
    userId: profile.id,
    updateType: "progress",
    title: "Penanganan dimulai",
    note,
    photos: [],
  });

  if (saveResult.status === "error") {
    await prisma.report.updateMany({
      where: {
        id: reportId,
        assignedSectionId: profile.section_id,
        status: "in_progress",
      },
      data: {
        status: "handled_by_village",
        internalHandlingNote: note,
      },
    });

    return saveResult;
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "in_progress",
    note,
  });

  revalidateKasiReport(reportId);

  return {
    status: "success",
    message: "Penanganan laporan berhasil ditandai sedang diproses.",
  };
}

export async function submitKasiProgressUpdate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireKasi();

  if (!profile.section_id) {
    return {
      status: "error",
      message: "Akun Anda belum ditautkan ke seksi desa.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const note = String(formData.get("note") || "").trim();
  const photos = getProgressPhotos(formData);
  const photoValidation = validateProgressPhotos(photos);

  if (photoValidation) {
    return photoValidation;
  }

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  if (!note) {
    return {
      status: "error",
      message: "Tulis catatan progres terlebih dahulu.",
    };
  }

  const report = await getAssignedReport(reportId, profile.section_id);

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  let effectiveStatus = report.status;

  if (report.status === "handled_by_village") {
    const hasExistingProgress = await reportHasProgressUpdates(reportId);

    if (!hasExistingProgress) {
      return {
        status: "error",
        message:
          "Update progres hanya tersedia setelah penanganan dimulai.",
      };
    }

    const { count: repairCount } = await prisma.report.updateMany({
      where: {
        id: reportId,
        assignedSectionId: profile.section_id,
        status: "handled_by_village",
      },
      data: { status: "in_progress" },
    });

    if (repairCount === 0) {
      return {
        status: "error",
        message: "Update progres hanya tersedia setelah penanganan dimulai.",
      };
    }

    effectiveStatus = "in_progress";
  }

  if (effectiveStatus !== "in_progress") {
    return {
      status: "error",
      message: "Update progres hanya tersedia setelah penanganan dimulai.",
    };
  }

  const saveResult = await saveProgressUpdate({
    reportId,
    userId: profile.id,
    updateType: "progress",
    title: "Update progres",
    note,
    photos,
  });

  if (saveResult.status === "error") {
    return saveResult;
  }

  await prisma.report.updateMany({
    where: { id: reportId, assignedSectionId: profile.section_id },
    data: { internalHandlingNote: note },
  });

  revalidateKasiReport(reportId);

  return {
    status: "success",
    message: "Update progres berhasil disimpan.",
  };
}

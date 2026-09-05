"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import { notifyUsersInternal } from "@/src/features/reports/internalNotifications";
import { hasReportProgressUpdates } from "@/src/features/reports/helpers";
import { extendDueDateByPauseWindow } from "@/src/lib/sla";

const allowedRoles = [
  "public",
  "admin",
  "kepala_desa",
  "sekdes",
  "kepala_dusun",
  "kasi",
] as const;

type ManagedUserRole = (typeof allowedRoles)[number];

async function requireUserManager() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (!["admin", "sekdes", "kepala_desa"].includes(profile.role)) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

async function requireBudgetReviewer() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (!["kepala_desa", "sekdes"].includes(profile.role)) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

function isManagedUserRole(role: string): role is ManagedUserRole {
  return allowedRoles.includes(role as ManagedUserRole);
}

function revalidateBudgetReviewPaths(reportId?: string | null) {
  revalidatePath("/dashboard/village");
  revalidatePath("/dashboard/village/budget-requests");
  revalidatePath("/dashboard/kasi");
  revalidatePath("/dashboard/kasi/reports");
  revalidatePath("/dashboard/kasi/budget");
  revalidatePath("/dashboard/admin/reports");
  revalidatePath("/dashboard/admin/follow-up");

  if (reportId) {
    revalidatePath(`/dashboard/kasi/reports/${reportId}`);
    revalidatePath(`/dashboard/admin/reports/${reportId}`);
  }
}


export async function updateVillageUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const manager = await requireUserManager();

  const userId = String(formData.get("user_id") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const phoneNumber = String(formData.get("phone_number") || "").trim();
  const role = String(formData.get("role") || "");
  const dusunId = String(formData.get("dusun_id") || "");
  const sectionId = String(formData.get("section_id") || "");

  if (!userId) {
    return {
      status: "error",
      message: "ID pengguna tidak ditemukan.",
    };
  }

  if (!fullName) {
    return {
      status: "error",
      message: "Nama lengkap wajib diisi.",
    };
  }

  if (!isManagedUserRole(role)) {
    return {
      status: "error",
      message: "Peran pengguna tidak valid.",
    };
  }

  if (role === "admin" && manager.role !== "admin") {
    return {
      status: "error",
      message: "Hanya admin yang bisa menetapkan peran admin.",
    };
  }

  if (role === "kepala_dusun" && !dusunId) {
    return {
      status: "error",
      message: "Kepala dusun harus ditautkan ke dusun.",
    };
  }

  if (role === "kasi" && !sectionId) {
    return {
      status: "error",
      message: "Kepala seksi harus ditautkan ke seksi.",
    };
  }

  if (userId === manager.id && role !== manager.role) {
    return {
      status: "error",
      message: "Anda tidak bisa mengubah peran akun sendiri.",
    };
  }

  try {
    await prisma.profile.update({
      where: { id: userId },
      data: {
        fullName,
        phoneNumber: phoneNumber || null,
        role,
        dusunId: role === "kepala_dusun" ? dusunId : null,
        sectionId: role === "kasi" ? sectionId : null,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memperbarui profil pengguna.",
    };
  }

  revalidatePath("/dashboard/village/users");
  revalidatePath(`/dashboard/village/users/${userId}`);

  return {
    status: "success",
    message: "Profil pengguna berhasil diperbarui.",
  };
}

export async function toggleVillageUserStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const manager = await requireUserManager();

  const userId = String(formData.get("user_id") || "");
  const action = String(formData.get("action") || "");

  if (!userId) {
    return {
      status: "error",
      message: "ID pengguna tidak ditemukan.",
    };
  }

  if (userId === manager.id) {
    return {
      status: "error",
      message: "Anda tidak bisa menonaktifkan akun sendiri.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Aksi status tidak valid.",
    };
  }

  try {
    await prisma.profile.update({
      where: { id: userId },
      data: {
        isActive: action === "activate",
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memperbarui status pengguna.",
    };
  }

  revalidatePath("/dashboard/village/users");
  revalidatePath(`/dashboard/village/users/${userId}`);

  return {
    status: "success",
    message:
      action === "activate"
        ? "Akun pengguna berhasil diaktifkan."
        : "Akun pengguna berhasil dinonaktifkan.",
  };
}

export async function createVillageUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const manager = await requireUserManager();

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const phoneNumber = String(formData.get("phone_number") || "").trim();
  const role = String(formData.get("role") || "");
  const dusunId = String(formData.get("dusun_id") || "");
  const sectionId = String(formData.get("section_id") || ""); 

  if (!fullName) {
    return {
      status: "error",
      message: "Nama lengkap wajib diisi.",
    };
  }

  if (!email) {
    return {
      status: "error",
      message: "Email wajib diisi.",
    };
  }

  if (!password || password.length < 6) {
    return {
      status: "error",
      message: "Kata sandi minimal 6 karakter.",
    };
  }

  if (!isManagedUserRole(role)) {
    return {
      status: "error",
      message: "Peran pengguna tidak valid.",
    };
  }

  if (role === "admin" && manager.role !== "admin") {
    return {
      status: "error",
      message: "Hanya admin yang bisa membuat akun admin lain.",
    };
  }

  if (role === "kepala_dusun" && !dusunId) {
    return {
      status: "error",
      message: "Kepala dusun harus ditautkan ke dusun.",
    };
  }

  if (role === "kasi" && !sectionId) {
    return {
      status: "error",
      message: "Seksi wajib dipilih untuk Kasi.",
    };
  }

  const existingProfile = await prisma.profile.findUnique({
    where: { email },
  });

  if (existingProfile) {
    return {
      status: "error",
      message: "Email ini sudah terdaftar. Silakan gunakan email lain.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.profile.create({
      data: {
        fullName,
        email,
        phoneNumber: phoneNumber || null,
        passwordHash,
        role,
        dusunId: role === "kepala_dusun" ? dusunId : null,
        sectionId: role === "kasi" ? sectionId : null,
        isActive: true,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal membuat pengguna.",
    };
  }

  revalidatePath("/dashboard/village/users");

  return {
    status: "success",
    message: "Akun pengguna berhasil dibuat.",
  };
}

export async function approveBudgetRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const reviewer = await requireBudgetReviewer();
  const requestId = String(formData.get("budget_request_id") || "");
  const reviewNote = String(formData.get("review_note") || "").trim();

  if (!requestId) {
    return {
      status: "error",
      message: "ID pengajuan anggaran tidak ditemukan.",
    };
  }

  const budgetRequest = await prisma.reportBudgetRequest.findUnique({
    where: { id: requestId },
    select: { id: true, reportId: true, requestedBy: true, status: true, createdAt: true },
  });

  if (!budgetRequest) {
    return {
      status: "error",
      message: "Pengajuan anggaran tidak ditemukan.",
    };
  }

  if (budgetRequest.status !== "submitted") {
    return {
      status: "error",
      message: "Hanya pengajuan anggaran yang masih menunggu peninjauan yang bisa disetujui.",
    };
  }

  const now = new Date();
  const { count: updatedCount } = await prisma.reportBudgetRequest.updateMany({
    where: { id: requestId, status: "submitted" },
    data: {
      status: "approved",
      reviewedBy: reviewer.id,
      reviewedAt: now,
      reviewNote: reviewNote || null,
    },
  });

  if (updatedCount === 0) {
    return {
      status: "error",
      message: "Pengajuan anggaran sudah tidak tersedia untuk disetujui.",
    };
  }

  const report = await prisma.report.findUnique({
    where: { id: budgetRequest.reportId },
    select: { id: true, reportNumber: true, title: true, status: true, resolutionDueAt: true },
  });

  if (report?.status === "waiting_budget") {
    const statusNote = reviewNote
      ? `Pengajuan anggaran disetujui: ${reviewNote}`
      : "Pengajuan anggaran disetujui.";
    const nextReportStatus = (await hasReportProgressUpdates(budgetRequest.reportId))
      ? "in_progress"
      : "handled_by_village";
    const nextResolutionDueAt = extendDueDateByPauseWindow(
      report.resolutionDueAt?.toISOString() ?? null,
      budgetRequest.createdAt.toISOString(),
      now.toISOString()
    );
    const { count: reportUpdatedCount } = await prisma.report.updateMany({
      where: { id: budgetRequest.reportId, status: "waiting_budget" },
      data: {
        status: nextReportStatus,
        resolutionDueAt: nextResolutionDueAt ? new Date(nextResolutionDueAt) : null,
        internalHandlingNote: statusNote,
      },
    });

    if (reportUpdatedCount === 0) {
      return {
        status: "error",
        message: "Laporan sudah tidak dalam status menunggu anggaran.",
      };
    }

    await createReportStatusLog({
      reportId: budgetRequest.reportId,
      oldStatus: "waiting_budget",
      newStatus: nextReportStatus,
      note: statusNote,
    });

    await recordSlaEvent({
      reportId: budgetRequest.reportId,
      eventType: "resumed_budget",
      previousResolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
      newResolutionDueAt: nextResolutionDueAt,
      note: statusNote,
    });
  }

  if (budgetRequest.requestedBy && report) {
    await notifyUsersInternal({
      userIds: [budgetRequest.requestedBy],
      reportId: budgetRequest.reportId,
      subject: `Anggaran disetujui ${report.reportNumber}`,
      message: `Pengajuan anggaran untuk laporan ${report.reportNumber} (${report.title}) telah disetujui.${reviewNote ? ` Catatan: ${reviewNote}` : ""}`,
    });
  }

  revalidateBudgetReviewPaths(budgetRequest.reportId);

  return {
    status: "success",
    message: "Pengajuan anggaran berhasil disetujui.",
  };
}

export async function rejectBudgetRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const reviewer = await requireBudgetReviewer();
  const requestId = String(formData.get("budget_request_id") || "");
  const reviewNote = String(formData.get("review_note") || "").trim();

  if (!requestId) {
    return {
      status: "error",
      message: "ID pengajuan anggaran tidak ditemukan.",
    };
  }

  if (!reviewNote) {
    return {
      status: "error",
      message: "Tulis alasan penolakan terlebih dahulu.",
    };
  }

  const budgetRequest = await prisma.reportBudgetRequest.findUnique({
    where: { id: requestId },
    select: { id: true, reportId: true, requestedBy: true, status: true, createdAt: true },
  });

  if (!budgetRequest) {
    return {
      status: "error",
      message: "Pengajuan anggaran tidak ditemukan.",
    };
  }

  if (budgetRequest.status !== "submitted") {
    return {
      status: "error",
      message: "Hanya pengajuan anggaran yang masih menunggu peninjauan yang bisa ditolak.",
    };
  }

  const now = new Date();
  const { count: updatedCount } = await prisma.reportBudgetRequest.updateMany({
    where: { id: requestId, status: "submitted" },
    data: {
      status: "rejected",
      reviewedBy: reviewer.id,
      reviewedAt: now,
      reviewNote,
    },
  });

  if (updatedCount === 0) {
    return {
      status: "error",
      message: "Pengajuan anggaran sudah tidak tersedia untuk ditolak.",
    };
  }

  const report = await prisma.report.findUnique({
    where: { id: budgetRequest.reportId },
    select: { id: true, reportNumber: true, title: true, status: true, resolutionDueAt: true },
  });

  if (report?.status === "waiting_budget") {
    const nextResolutionDueAt = extendDueDateByPauseWindow(
      report.resolutionDueAt?.toISOString() ?? null,
      budgetRequest.createdAt.toISOString(),
      now.toISOString()
    );
    const { count: reportUpdatedCount } = await prisma.report.updateMany({
      where: { id: budgetRequest.reportId, status: "waiting_budget" },
      data: {
        status: "handled_by_village",
        resolutionDueAt: nextResolutionDueAt ? new Date(nextResolutionDueAt) : null,
        internalHandlingNote: reviewNote,
      },
    });

    if (reportUpdatedCount === 0) {
      return {
        status: "error",
        message: "Laporan sudah tidak dalam status menunggu anggaran.",
      };
    }

    await createReportStatusLog({
      reportId: budgetRequest.reportId,
      oldStatus: "waiting_budget",
      newStatus: "handled_by_village",
      note: `Pengajuan anggaran ditolak: ${reviewNote}`,
    });

    await recordSlaEvent({
      reportId: budgetRequest.reportId,
      eventType: "resumed_budget",
      previousResolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
      newResolutionDueAt: nextResolutionDueAt,
      note: `Pengajuan anggaran ditolak: ${reviewNote}`,
    });
  }

  if (budgetRequest.requestedBy && report) {
    await notifyUsersInternal({
      userIds: [budgetRequest.requestedBy],
      reportId: budgetRequest.reportId,
      subject: `Anggaran ditolak ${report.reportNumber}`,
      message: `Pengajuan anggaran untuk laporan ${report.reportNumber} (${report.title}) ditolak. Catatan: ${reviewNote}`,
    });
  }

  revalidateBudgetReviewPaths(budgetRequest.reportId);

  return {
    status: "success",
    message: "Pengajuan anggaran berhasil ditolak.",
  };
}

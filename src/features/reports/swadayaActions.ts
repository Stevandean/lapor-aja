"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import type { ActionState } from "@/src/types/action";

function revalidateSwadayaPaths(reportId: string) {
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/village/reports/${reportId}`);
  revalidatePath("/dashboard/village/sla");
  revalidatePath(`/dashboard/kasi/reports/${reportId}`);
  revalidatePath("/dashboard/kasi/reports");
  revalidatePath("/dashboard/public/swadaya");
}

// Admin/Kepala Desa/Sekdes selalu boleh; Kasi cuma boleh untuk laporan di
// seksinya sendiri (bukan seksi lain) — sesuai Keputusan 5.
async function requireSwadayaCampaignManager(reportId: string) {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      assignedSectionId: true,
      resolutionDueAt: true,
    },
  });

  if (!report) {
    return { profile, report: null };
  }

  const isVillageLeadershipOrAdmin = ["admin", "kepala_desa", "sekdes"].includes(
    profile.role
  );
  const isAssignedSectionKasi =
    profile.role === "kasi" && profile.section_id === report.assignedSectionId;

  if (!isVillageLeadershipOrAdmin && !isAssignedSectionKasi) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return { profile, report };
}

export async function openSwadayaCampaign(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const reportId = String(formData.get("report_id") || "");
  const targetNote = String(formData.get("target_note") || "").trim();

  if (!reportId) {
    return { status: "error", message: "Laporan tidak ditemukan." };
  }

  const { profile, report } = await requireSwadayaCampaignManager(reportId);

  if (!report) {
    return { status: "error", message: "Laporan tidak ditemukan." };
  }

  // Keputusan 5: eligibilitas = seksi sudah ditugaskan DAN laporan belum
  // selesai (resolved).
  if (!report.assignedSectionId) {
    return {
      status: "error",
      message:
        "Laporan ini belum diklasifikasi ke seksi mana pun, galang swadaya belum bisa dibuka.",
    };
  }

  if (report.status === "resolved") {
    return {
      status: "error",
      message: "Laporan ini sudah selesai, galang swadaya tidak diperlukan lagi.",
    };
  }

  const existingOpenCampaign = await prisma.swadayaCampaign.findFirst({
    where: { reportId, status: "open" },
  });

  if (existingOpenCampaign) {
    return {
      status: "error",
      message: "Sudah ada galang swadaya yang sedang berjalan untuk laporan ini.",
    };
  }

  const previousStatus = report.status;

  await prisma.swadayaCampaign.create({
    data: {
      reportId,
      status: "open",
      targetNote: targetNote || null,
      openedBy: profile.id,
    },
  });

  // Keputusan 3: REUSE status waiting_budget (bukan status/enum baru) --
  // efeknya calculateEffectiveSlaStatus() otomatis mengembalikan
  // "paused_budget" tanpa perlu diubah sama sekali. Pembeda "ini jeda
  // ANGGARAN atau SWADAYA" murni dari keberadaan SwadayaCampaign yang
  // masih open (lihat getOpenSwadayaCampaignReportIds), bukan dari nilai
  // status itu sendiri.
  await prisma.report.update({
    where: { id: reportId },
    data: { status: "waiting_budget" },
  });

  await createReportStatusLog({
    reportId,
    oldStatus: previousStatus,
    newStatus: "waiting_budget",
    note: "Galang swadaya masyarakat dibuka untuk mempercepat penanganan laporan.",
  });

  // Note SENGAJA menyebut eksplisit "swadaya" (bukan "anggaran") supaya
  // linimasa SLA presisi meski eventType-nya sama seperti jeda anggaran.
  await recordSlaEvent({
    reportId,
    eventType: "paused_budget",
    previousResolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
    newResolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
    note: "SLA dijeda karena galang swadaya masyarakat sedang berjalan (bukan pengajuan anggaran).",
  });

  revalidateSwadayaPaths(reportId);

  return { status: "success", message: "Galang swadaya berhasil dibuka." };
}

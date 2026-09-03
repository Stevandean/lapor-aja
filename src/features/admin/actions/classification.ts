"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { AssetStatus, AuthorityLevel, FollowUpType, ReportStatus } from "@prisma/client";
import type { ActionState } from "@/src/types/action";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import { notifySectionKasiAssignment } from "@/src/features/reports/internalNotifications";
import { requireAdmin } from "./shared";

export async function classifyAssetReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const reportId = String(formData.get("report_id") || "");
  const assetStatus = String(formData.get("asset_status") || "");
  const authorityLevel = String(formData.get("authority_level") || "");
  const followUpType = String(formData.get("follow_up_type") || "");
  const assignedSectionId = String(
    formData.get("assigned_section_id") || ""
  ).trim();
  const agencyId = String(formData.get("agency_id") || "").trim();

  const allowedAssetStatuses = [
    "aset_desa",
    "bukan_aset_desa",
    "belum_diketahui",
  ];

  const allowedAuthorityLevels = [
    "desa",
    "kabupaten_kota",
    "provinsi",
    "nasional",
    "belum_diketahui",
  ];

  const allowedFollowUpTypes = [
    "ditangani_desa",
    "diteruskan_ke_dinas",
    "diusulkan_musrenbang",
    "menunggu_anggaran",
  ];

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  if (!allowedAssetStatuses.includes(assetStatus)) {
    return {
      status: "error",
      message: "Pilih status aset yang valid.",
    };
  }

  if (!allowedAuthorityLevels.includes(authorityLevel)) {
    return {
      status: "error",
      message: "Pilih level kewenangan yang valid.",
    };
  }

  if (!allowedFollowUpTypes.includes(followUpType)) {
    return {
      status: "error",
      message: "Pilih jenis tindak lanjut yang valid.",
    };
  }

  const requiresVillageSection = [
    "ditangani_desa",
    "diusulkan_musrenbang",
    "menunggu_anggaran",
  ].includes(followUpType);
  const requiresAgency = followUpType === "diteruskan_ke_dinas";
  let selectedSectionId: string | null = null;
  let selectedAgencyId: string | null = null;
  let nextStatus: ReportStatus | "" = "";

  if (followUpType === "ditangani_desa") {
    nextStatus = "handled_by_village";
  }

  if (followUpType === "diteruskan_ke_dinas") {
    nextStatus = "forwarded_to_agency";
  }

  if (
    followUpType === "diusulkan_musrenbang" ||
    followUpType === "menunggu_anggaran"
  ) {
    nextStatus = "waiting_budget";
  }

  if (requiresVillageSection) {
    if (!assignedSectionId) {
      return {
        status: "error",
        message:
          "Pilih seksi desa tujuan sebelum menyimpan klasifikasi.",
      };
    }

    const section = await prisma.villageSection.findFirst({
      where: { id: assignedSectionId, isActive: true },
      select: { id: true },
    });

    if (!section) {
      return {
        status: "error",
        message: "Seksi desa yang dipilih tidak tersedia atau tidak aktif.",
      };
    }

    selectedSectionId = section.id;
  }

  if (requiresAgency) {
    if (!agencyId) {
      return {
        status: "error",
        message: "Pilih instansi tujuan sebelum menyimpan klasifikasi.",
      };
    }

    const agency = await prisma.agency.findFirst({
      where: { id: agencyId, isActive: true },
      select: { id: true },
    });

    if (!agency) {
      return {
        status: "error",
        message: "Instansi yang dipilih tidak tersedia atau tidak aktif.",
      };
    }

    selectedAgencyId = agency.id;
  }

  const report = await prisma.report.findFirst({
    where: { id: reportId, status: "verified_valid" },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      assignedSectionId: true,
      resolutionDueAt: true,
    },
  });

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau sudah diklasifikasi.",
    };
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        assetStatus: assetStatus as AssetStatus,
        authorityLevel: authorityLevel as AuthorityLevel,
        followUpType: followUpType as FollowUpType,
        assignedSectionId: selectedSectionId,
        agencyId: selectedAgencyId,
        status: nextStatus as ReportStatus,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menyimpan klasifikasi.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "verified_valid",
    newStatus: nextStatus,
    note: "Laporan sudah diklasifikasi dan diarahkan oleh admin.",
  });

  if (selectedSectionId && selectedSectionId !== report.assignedSectionId) {
    try {
      await prisma.reportSectionAssignment.create({
        data: {
          reportId,
          sectionId: selectedSectionId,
          assignedBy: profile.id,
        },
      });
    } catch (error) {
      console.error(
        "Failed to create report section assignment:",
        error instanceof Error ? error.message : error
      );
    }
  }

  if (nextStatus === "waiting_budget") {
    await recordSlaEvent({
      reportId,
      eventType: "paused_budget",
      previousResolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
      newResolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
      note: "SLA dijeda karena laporan menunggu anggaran.",
    });
  }

  if (selectedSectionId && ["handled_by_village", "waiting_budget"].includes(nextStatus)) {
    await notifySectionKasiAssignment({
      sectionId: selectedSectionId,
      reportId,
      reportNumber: report.reportNumber,
      reportTitle: report.title,
    });
  }

  revalidatePath("/dashboard/admin/asset-classification");
  revalidatePath(`/dashboard/admin/asset-classification/${reportId}`);
  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/admin/letters");
  revalidatePath("/dashboard/kasi");
  revalidatePath("/dashboard/kasi/reports");
  revalidatePath("/dashboard/village/reports");

  return {
    status: "success",
    message: "Laporan berhasil diklasifikasi dan diarahkan.",
  };
}

export async function processReportFollowUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") || "");
  const agencyId = String(formData.get("agency_id") || "").trim();

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  const report = await prisma.report.findFirst({
    where: { id: reportId, status: "classified" },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      followUpType: true,
      assignedSectionId: true,
      resolutionDueAt: true,
    },
  });

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau belum siap ditindaklanjuti.",
    };
  }

  let nextStatus: ReportStatus | "" = "";

  if (report.followUpType === "ditangani_desa") {
    nextStatus = "handled_by_village";
  }

  if (report.followUpType === "diteruskan_ke_dinas") {
    nextStatus = "forwarded_to_agency";
  }

  if (
    report.followUpType === "diusulkan_musrenbang" ||
    report.followUpType === "menunggu_anggaran"
  ) {
    nextStatus = "waiting_budget";
  }

  if (!nextStatus) {
    return {
      status: "error",
      message: "Tentukan jenis tindak lanjut yang valid sebelum memproses laporan.",
    };
  }

  if (
    ["ditangani_desa", "diusulkan_musrenbang", "menunggu_anggaran"].includes(
      report.followUpType
    )
  ) {
    if (!report.assignedSectionId) {
      return {
        status: "error",
        message:
          "Tugaskan laporan tindak lanjut desa ke seksi desa sebelum diproses.",
      };
    }

    const section = await prisma.villageSection.findFirst({
      where: { id: report.assignedSectionId, isActive: true },
      select: { id: true },
    });

    if (!section) {
      return {
        status: "error",
        message: "Seksi desa yang ditugaskan tidak aktif atau tidak tersedia.",
      };
    }
  }

  if (report.followUpType === "diteruskan_ke_dinas") {
    if (!agencyId) {
      return {
        status: "error",
        message: "Pilih instansi tujuan sebelum meneruskan laporan.",
      };
    }

    const agency = await prisma.agency.findFirst({
      where: { id: agencyId, isActive: true },
      select: { id: true, name: true },
    });

    if (!agency) {
      return {
        status: "error",
        message: "Instansi yang dipilih tidak tersedia atau tidak aktif.",
      };
    }
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: nextStatus as ReportStatus,
        agencyId: report.followUpType === "diteruskan_ke_dinas" ? agencyId : null,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memproses tindak lanjut.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "classified",
    newStatus: nextStatus,
    note: "Arah tindak lanjut laporan sudah ditentukan.",
  });

  if (nextStatus === "waiting_budget") {
    await recordSlaEvent({
      reportId,
      eventType: "paused_budget",
      previousResolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
      newResolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
      note: "SLA dijeda karena laporan menunggu anggaran.",
    });
  }

  if (
    report.assignedSectionId &&
    ["handled_by_village", "waiting_budget"].includes(nextStatus)
  ) {
    await notifySectionKasiAssignment({
      sectionId: report.assignedSectionId,
      reportId,
      reportNumber: report.reportNumber,
      reportTitle: report.title,
    });
  }

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/asset-classification");
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/kasi");
  revalidatePath("/dashboard/kasi/reports");

  return {
    status: "success",
    message: "Tindak lanjut laporan berhasil diproses.",
  };
}

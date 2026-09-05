"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import { hasReportProgressUpdates } from "@/src/features/reports/helpers";
import { extendDueDateByPauseWindow } from "@/src/lib/sla";
import type { ActionState } from "@/src/types/action";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads", "swadaya");

async function requireVillageLeadershipOrAdmin() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (!["admin", "kepala_desa", "sekdes"].includes(profile.role)) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

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

const CONTRIBUTION_TYPES = ["uang", "material", "logistik", "tenaga"] as const;

// Keputusan 2: kontribusi WAJIB login (semua role, tidak dibatasi cuma
// "public") — contributorId/Name/Phone SELALU diambil dari sesi, TIDAK
// PERNAH dari input form (form-nya sendiri cuma menampilkan readonly),
// supaya tidak ada celah orang mengisi identitas orang lain.
export async function submitSwadayaContribution(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();

  if (!profile) {
    redirect(
      `${ROUTES.LOGIN}?redirect=${encodeURIComponent("/dashboard/public/swadaya")}`
    );
  }

  const campaignId = String(formData.get("campaign_id") || "");
  const type = String(formData.get("type") || "");

  if (!campaignId) {
    return { status: "error", message: "Galang swadaya tidak ditemukan." };
  }

  if (!CONTRIBUTION_TYPES.includes(type as (typeof CONTRIBUTION_TYPES)[number])) {
    return { status: "error", message: "Jenis kontribusi tidak valid." };
  }

  const campaign = await prisma.swadayaCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, reportId: true, status: true },
  });

  if (!campaign || campaign.status !== "open") {
    return {
      status: "error",
      message: "Galang swadaya ini sudah tidak menerima kontribusi baru.",
    };
  }

  let amount: number | null = null;
  let itemDescription: string | null = null;
  let itemQuantity: number | null = null;
  let itemUnit: string | null = null;
  let availabilityNote: string | null = null;

  if (type === "uang") {
    amount = Number(formData.get("amount"));

    if (!Number.isFinite(amount) || amount <= 0) {
      return { status: "error", message: "Jumlah donasi tidak valid." };
    }
  } else if (type === "material" || type === "logistik") {
    itemDescription = String(formData.get("item_description") || "").trim();
    const quantityRaw = Number(formData.get("item_quantity"));
    itemUnit = String(formData.get("item_unit") || "").trim();

    if (!itemDescription || !Number.isFinite(quantityRaw) || quantityRaw <= 0 || !itemUnit) {
      return {
        status: "error",
        message: "Lengkapi deskripsi, jumlah, dan satuan barang.",
      };
    }

    itemQuantity = quantityRaw;
  } else {
    availabilityNote = String(formData.get("availability_note") || "").trim();

    if (!availabilityNote) {
      return {
        status: "error",
        message: "Jelaskan ketersediaan waktu/tenaga Anda.",
      };
    }
  }

  await prisma.swadayaContribution.create({
    data: {
      campaignId,
      contributorId: profile.id,
      contributorName: profile.full_name,
      contributorPhone: profile.phone_number,
      type: type as (typeof CONTRIBUTION_TYPES)[number],
      amount,
      itemDescription,
      itemQuantity,
      itemUnit,
      availabilityNote,
      status: "pending",
    },
  });

  revalidateSwadayaPaths(campaign.reportId);
  revalidatePath(`/dashboard/public/swadaya/${campaignId}`);

  return {
    status: "success",
    message: "Terima kasih, kontribusi Anda sudah tercatat dan menunggu verifikasi.",
  };
}

// Cabang 5d, tahap 1/2: pending -> verified. Cuma mengonfirmasi janji
// kontribusi itu sah/masuk akal — BELUM berarti barang/dana sudah di
// tangan desa (itu tahap "receive" terpisah di bawah).
export async function verifySwadayaContribution(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireVillageLeadershipOrAdmin();
  const contributionId = String(formData.get("contribution_id") || "");

  const contribution = await prisma.swadayaContribution.findUnique({
    where: { id: contributionId },
    include: { campaign: { select: { reportId: true } } },
  });

  if (!contribution) {
    return { status: "error", message: "Kontribusi tidak ditemukan." };
  }

  if (contribution.status !== "pending") {
    return {
      status: "error",
      message: "Kontribusi ini sudah tidak menunggu verifikasi.",
    };
  }

  await prisma.swadayaContribution.update({
    where: { id: contributionId },
    data: { status: "verified", verifiedBy: profile.id, verifiedAt: new Date() },
  });

  revalidateSwadayaPaths(contribution.campaign.reportId);

  return { status: "success", message: "Kontribusi berhasil diverifikasi." };
}

// Cabang 5d, tahap 2/2: verified -> received. Ini peristiwa TERPISAH dari
// verifikasi (bisa beda waktu, beda orang) — menandai barang/dana/tenaga
// itu SUNGGUH sudah diserahkan ke desa, opsional dengan foto bukti.
export async function receiveSwadayaContribution(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireVillageLeadershipOrAdmin();
  const contributionId = String(formData.get("contribution_id") || "");
  const receivedNote = String(formData.get("received_note") || "").trim();
  const proofPhoto = formData.get("proof_photo");

  const contribution = await prisma.swadayaContribution.findUnique({
    where: { id: contributionId },
    include: { campaign: { select: { reportId: true } } },
  });

  if (!contribution) {
    return { status: "error", message: "Kontribusi tidak ditemukan." };
  }

  if (contribution.status !== "verified") {
    return {
      status: "error",
      message: "Kontribusi harus diverifikasi dulu sebelum dikonfirmasi diterima.",
    };
  }

  let proofPhotoPath: string | null = null;

  if (proofPhoto instanceof File && proofPhoto.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(proofPhoto.type)) {
      return {
        status: "error",
        message: "Foto bukti harus berformat JPG, PNG, atau WEBP.",
      };
    }

    if (proofPhoto.size > 10 * 1024 * 1024) {
      return { status: "error", message: "Ukuran foto bukti maksimal 10MB." };
    }

    const dir = path.join(UPLOADS_ROOT, contribution.campaignId, contribution.id);
    await fs.mkdir(dir, { recursive: true });

    const extension = proofPhoto.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `/uploads/swadaya/${contribution.campaignId}/${contribution.id}/${fileName}`;

    const buffer = Buffer.from(await proofPhoto.arrayBuffer());
    await fs.writeFile(path.join(dir, fileName), buffer);
    proofPhotoPath = filePath;
  }

  await prisma.swadayaContribution.update({
    where: { id: contributionId },
    data: {
      status: "received",
      receivedBy: profile.id,
      receivedAt: new Date(),
      receivedNote: receivedNote || null,
      ...(proofPhotoPath ? { proofPhotoPath } : {}),
    },
  });

  revalidateSwadayaPaths(contribution.campaign.reportId);

  return { status: "success", message: "Kontribusi berhasil dikonfirmasi diterima." };
}

// Cabang 5d: tutup campaign secara manual, lalu resume SLA (Tugas 2 poin
// 3) memakai extendDueDateByPauseWindow yang sama, basisnya
// openedAt/closedAt campaign ini (BUKAN lagi timestamp ReportBudgetRequest
// seperti alur anggaran biasa).
export async function closeSwadayaCampaign(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireVillageLeadershipOrAdmin();

  const campaignId = String(formData.get("campaign_id") || "");
  const closedReason = String(formData.get("closed_reason") || "").trim();

  const campaign = await prisma.swadayaCampaign.findUnique({
    where: { id: campaignId },
    include: {
      report: { select: { id: true, status: true, resolutionDueAt: true } },
    },
  });

  if (!campaign) {
    return { status: "error", message: "Galang swadaya tidak ditemukan." };
  }

  if (campaign.status !== "open") {
    return { status: "error", message: "Galang swadaya ini sudah ditutup sebelumnya." };
  }

  const now = new Date();

  await prisma.swadayaCampaign.update({
    where: { id: campaignId },
    data: { status: "closed", closedAt: now, closedReason: closedReason || null },
  });

  const { report } = campaign;

  if (report.status === "waiting_budget") {
    const nextReportStatus = (await hasReportProgressUpdates(report.id))
      ? "in_progress"
      : "handled_by_village";
    const nextResolutionDueAt = extendDueDateByPauseWindow(
      report.resolutionDueAt?.toISOString() ?? null,
      campaign.openedAt.toISOString(),
      now.toISOString()
    );

    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: nextReportStatus,
        resolutionDueAt: nextResolutionDueAt ? new Date(nextResolutionDueAt) : null,
      },
    });

    await createReportStatusLog({
      reportId: report.id,
      oldStatus: "waiting_budget",
      newStatus: nextReportStatus,
      note: "Galang swadaya ditutup, SLA dilanjutkan.",
    });

    await recordSlaEvent({
      reportId: report.id,
      eventType: "resumed_budget",
      previousResolutionDueAt: report.resolutionDueAt?.toISOString() ?? null,
      newResolutionDueAt: nextResolutionDueAt,
      note: "SLA dilanjutkan setelah galang swadaya masyarakat ditutup.",
    });
  }

  revalidateSwadayaPaths(report.id);

  return { status: "success", message: "Galang swadaya berhasil ditutup." };
}

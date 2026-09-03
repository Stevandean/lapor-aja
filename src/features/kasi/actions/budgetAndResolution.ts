"use server";

import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
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

function getStringArray(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value || "").trim());
}

function getBudgetItems(formData: FormData) {
  const names = getStringArray(formData, "item_name");
  const descriptions = getStringArray(formData, "item_description");
  const quantities = getStringArray(formData, "item_quantity");
  const units = getStringArray(formData, "item_unit");
  const unitPrices = getStringArray(formData, "item_unit_price");

  return names
    .map((name, index) => {
      const quantity = Number(quantities[index]);
      const unitPrice = Number(unitPrices[index]);

      return {
        item_name: name,
        description: descriptions[index] || null,
        quantity,
        unit: units[index] || "unit",
        unit_price: unitPrice,
      };
    })
    .filter((item) => item.item_name);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function submitKasiBudgetRequest(
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
  const summaryNote = String(formData.get("summary_note") || "").trim();
  const items = getBudgetItems(formData);

  if (!reportId) {
    return {
      status: "error",
      message: "Pilih laporan yang ditugaskan.",
    };
  }

  if (!summaryNote) {
    return {
      status: "error",
      message: "Jelaskan kebutuhan anggaran terlebih dahulu.",
    };
  }

  if (items.length === 0) {
    return {
      status: "error",
      message: "Tambahkan minimal satu item anggaran.",
    };
  }

  for (const item of items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      return {
        status: "error",
        message: "Jumlah setiap item harus lebih dari 0.",
      };
    }

    if (!Number.isFinite(item.unit_price) || item.unit_price < 0) {
      return {
        status: "error",
        message: "Harga satuan setiap item harus 0 atau lebih.",
      };
    }
  }

  const report = await getAssignedReport(reportId, profile.section_id);

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  if (!["handled_by_village", "in_progress"].includes(report.status)) {
    return {
      status: "error",
      message:
        "Pengajuan anggaran hanya tersedia sebelum atau selama penanganan aktif.",
    };
  }

  const totalEstimatedBudget = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const pendingBudgetRequest = await prisma.reportBudgetRequest.findFirst({
    where: { reportId, status: "submitted" },
    select: { id: true },
  });

  if (pendingBudgetRequest) {
    return {
      status: "error",
      message: "Laporan ini sudah memiliki pengajuan anggaran yang menunggu peninjauan.",
    };
  }

  let budgetRequestId: string;

  try {
    const budgetRequest = await prisma.reportBudgetRequest.create({
      data: {
        reportId,
        requestedBy: profile.id,
        sectionId: profile.section_id,
        summaryNote,
        totalEstimatedBudget,
        status: "submitted",
      },
      select: { id: true },
    });

    budgetRequestId = budgetRequest.id;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal mengirim pengajuan anggaran.",
    };
  }

  try {
    await prisma.reportBudgetRequestItem.createMany({
      data: items.map((item) => ({
        budgetRequestId,
        itemName: item.item_name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unit_price,
      })),
    });
  } catch (error) {
    await prisma.reportBudgetRequest.delete({ where: { id: budgetRequestId } }).catch(() => {});

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menyimpan item anggaran.",
    };
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "waiting_budget",
        internalHandlingNote: summaryNote,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memperbarui status laporan.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: report.status,
    newStatus: "waiting_budget",
    note: summaryNote,
  });

  await recordSlaEvent({
    reportId,
    eventType: "paused_budget",
    previousResolutionDueAt: report.resolution_due_at,
    newResolutionDueAt: report.resolution_due_at,
    note: "SLA dijeda selama menunggu peninjauan anggaran.",
  });

  await notifyRoleInternal({
    roles: ["kepala_desa", "sekdes"],
    reportId,
    subject: `Pengajuan anggaran ${report.report_number}`,
    message: `Kasi mengajukan anggaran untuk laporan ${report.report_number} (${report.title}) dengan estimasi ${formatCurrency(totalEstimatedBudget)}. Catatan: ${summaryNote}`,
  });

  revalidateKasiReport(reportId);

  return {
    status: "success",
    message: "Pengajuan anggaran berhasil dikirim.",
  };
}

export async function resolveKasiReport(
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
      message: "Tulis catatan penyelesaian terlebih dahulu.",
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

    if (hasExistingProgress) {
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
          message: "Hanya laporan yang sedang diproses yang bisa diselesaikan.",
        };
      }

      effectiveStatus = "in_progress";
    }
  }

  if (effectiveStatus !== "in_progress") {
    return {
      status: "error",
      message: "Hanya laporan yang sedang diproses yang bisa diselesaikan.",
    };
  }

  const saveResult = await saveProgressUpdate({
    reportId,
    userId: profile.id,
    updateType: "progress",
    title: "Laporan selesai",
    note,
    photos,
  });

  if (saveResult.status === "error") {
    return saveResult;
  }

  const { count } = await prisma.report.updateMany({
    where: { id: reportId, assignedSectionId: profile.section_id },
    data: {
      status: "resolved",
      slaStatus: "completed",
      internalHandlingNote: note,
      resolvedAt: new Date(),
    },
  });

  if (count === 0) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan atau tidak ditugaskan ke seksi Anda.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "in_progress",
    newStatus: "resolved",
    note,
  });

  await recordSlaEvent({
    reportId,
    eventType: "completed",
    note: "SLA selesai karena laporan diselesaikan oleh Kasi.",
  });

  revalidateKasiReport(reportId);

  return {
    status: "success",
    message: "Laporan berhasil ditandai selesai.",
  };
}

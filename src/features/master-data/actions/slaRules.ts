"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { requireMasterDataManager } from "./shared";

export async function updateSlaRule(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const ruleId = String(formData.get("rule_id") || "");
  const verificationHours = Number(formData.get("verification_hours"));
  const resolutionHours = Number(formData.get("resolution_hours"));
  const description = String(formData.get("description") || "").trim();

  if (!ruleId) {
    return {
      status: "error",
      message: "ID aturan SLA tidak ditemukan.",
    };
  }

  if (
    Number.isNaN(verificationHours) ||
    Number.isNaN(resolutionHours) ||
    verificationHours <= 0 ||
    resolutionHours <= 0
  ) {
    return {
      status: "error",
      message: "Jam verifikasi dan penyelesaian harus lebih dari 0.",
    };
  }

  if (verificationHours > resolutionHours) {
    return {
      status: "error",
      message:
        "Jam verifikasi tidak boleh lebih besar dari jam penyelesaian.",
    };
  }

  try {
    await prisma.slaRule.update({
      where: { id: ruleId },
      data: {
        verificationHours,
        resolutionHours,
        description: description || null,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memperbarui aturan SLA.",
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/sla-rules");
  revalidatePath("/dashboard/village/sla");

  return {
    status: "success",
    message: "Aturan SLA berhasil diperbarui.",
  };
}

export async function toggleSlaRuleStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const ruleId = String(formData.get("rule_id") || "");
  const action = String(formData.get("action") || "");

  if (!ruleId) {
    return {
      status: "error",
      message: "ID aturan SLA tidak ditemukan.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Aksi aturan SLA tidak valid.",
    };
  }

  const rule = await prisma.slaRule.findUnique({
    where: { id: ruleId },
    select: { id: true, priority: true },
  });

  if (!rule) {
    return {
      status: "error",
      message: "Aturan SLA tidak ditemukan.",
    };
  }

  if (action === "activate") {
    await prisma.slaRule.updateMany({
      where: { priority: rule.priority, id: { not: ruleId } },
      data: { isActive: false },
    });
  }

  if (action === "deactivate") {
    const activeSiblingCount = await prisma.slaRule.count({
      where: { priority: rule.priority, isActive: true, id: { not: ruleId } },
    });

    if (activeSiblingCount === 0) {
      return {
        status: "error",
        message:
          "Setiap prioritas harus memiliki minimal satu aturan SLA aktif untuk persetujuan laporan.",
      };
    }
  }

  try {
    await prisma.slaRule.update({
      where: { id: ruleId },
      data: { isActive: action === "activate" },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal mengubah status aturan SLA.",
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/sla-rules");
  revalidatePath("/dashboard/village/sla");

  return {
    status: "success",
    message:
      action === "activate"
        ? "Aturan SLA berhasil diaktifkan."
        : "Aturan SLA berhasil dinonaktifkan.",
  };
}

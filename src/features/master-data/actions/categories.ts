"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { requireMasterDataManager } from "./shared";

type SlaOverrideInput =
  | { status: "none" }
  | { status: "error"; message: string }
  | { status: "set"; verificationHours: number; resolutionHours: number };

// Cabang 1b: kedua field durasi khusus opsional, tapi kalau salah satu
// diisi, keduanya wajib diisi (SlaCategoryThreshold tidak punya kolom
// nullable untuk salah satunya).
function parseSlaOverrideInput(formData: FormData): SlaOverrideInput {
  const verificationHoursRaw = String(
    formData.get("sla_verification_hours") || ""
  ).trim();
  const resolutionHoursRaw = String(
    formData.get("sla_resolution_hours") || ""
  ).trim();

  const hasVerification = verificationHoursRaw !== "";
  const hasResolution = resolutionHoursRaw !== "";

  if (!hasVerification && !hasResolution) {
    return { status: "none" };
  }

  if (hasVerification !== hasResolution) {
    return {
      status: "error",
      message:
        "Isi kedua durasi khusus (verifikasi dan penyelesaian) sekaligus, atau kosongkan keduanya untuk memakai aturan prioritas biasa.",
    };
  }

  const verificationHours = Number(verificationHoursRaw);
  const resolutionHours = Number(resolutionHoursRaw);

  if (
    !Number.isFinite(verificationHours) ||
    !Number.isFinite(resolutionHours) ||
    verificationHours <= 0 ||
    resolutionHours <= 0
  ) {
    return {
      status: "error",
      message: "Durasi khusus harus berupa angka jam lebih dari 0.",
    };
  }

  if (verificationHours > resolutionHours) {
    return {
      status: "error",
      message:
        "Durasi verifikasi khusus tidak boleh lebih besar dari durasi penyelesaian.",
    };
  }

  return { status: "set", verificationHours, resolutionHours };
}

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    return {
      status: "error",
      message: "Nama kategori wajib diisi.",
    };
  }

  const slaOverride = parseSlaOverrideInput(formData);

  if (slaOverride.status === "error") {
    return { status: "error", message: slaOverride.message };
  }

  let categoryId: string;

  try {
    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        isActive: true,
      },
      select: { id: true },
    });

    categoryId = category.id;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal membuat kategori.",
    };
  }

  if (slaOverride.status === "set") {
    try {
      await prisma.slaCategoryThreshold.create({
        data: {
          categoryId,
          verificationHours: slaOverride.verificationHours,
          resolutionHours: slaOverride.resolutionHours,
        },
      });
    } catch (error) {
      return {
        status: "error",
        message:
          "Kategori berhasil dibuat, tapi durasi SLA khusus gagal disimpan: " +
          (error instanceof Error ? error.message : "kesalahan tidak diketahui") +
          ". Buka Ubah Kategori untuk mencoba lagi.",
      };
    }
  }

  revalidatePath("/dashboard/admin/master-data/categories");

  return {
    status: "success",
    message: "Kategori berhasil dibuat.",
  };
}

export async function updateCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const categoryId = String(formData.get("category_id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!categoryId) {
    return {
      status: "error",
      message: "ID kategori tidak ditemukan.",
    };
  }

  if (!name) {
    return {
      status: "error",
      message: "Nama kategori wajib diisi.",
    };
  }

  const slaOverride = parseSlaOverrideInput(formData);

  if (slaOverride.status === "error") {
    return { status: "error", message: slaOverride.message };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        description: description || null,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memperbarui kategori.",
    };
  }

  try {
    if (slaOverride.status === "set") {
      await prisma.slaCategoryThreshold.upsert({
        where: { categoryId },
        create: {
          categoryId,
          verificationHours: slaOverride.verificationHours,
          resolutionHours: slaOverride.resolutionHours,
        },
        update: {
          verificationHours: slaOverride.verificationHours,
          resolutionHours: slaOverride.resolutionHours,
        },
      });
    } else {
      await prisma.slaCategoryThreshold.deleteMany({ where: { categoryId } });
    }
  } catch (error) {
    return {
      status: "error",
      message:
        "Kategori berhasil diperbarui, tapi durasi SLA khusus gagal disimpan: " +
        (error instanceof Error ? error.message : "kesalahan tidak diketahui"),
    };
  }

  revalidatePath("/dashboard/admin/master-data/categories");

  return {
    status: "success",
    message: "Kategori berhasil diperbarui.",
  };
}

export async function toggleCategoryStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const categoryId = String(formData.get("category_id") || "");
  const action = String(formData.get("action") || "");

  if (!categoryId) {
    return {
      status: "error",
      message: "ID kategori tidak ditemukan.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Aksi kategori tidak valid.",
    };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: action === "activate" },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal mengubah status kategori.",
    };
  }

  revalidatePath("/dashboard/admin/master-data/categories");

  return {
    status: "success",
    message:
      action === "activate"
        ? "Kategori berhasil diaktifkan."
        : "Kategori berhasil dinonaktifkan.",
  };
}

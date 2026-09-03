"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { requireAdmin } from "./shared";

export async function createVillageSection(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    return {
      status: "error",
      message: "Nama seksi wajib diisi.",
    };
  }

  const normalizedCode = code
    ? code.toUpperCase().replace(/\s+/g, "_")
    : null;

  const lastSection = await prisma.villageSection.findFirst({
    select: { sortOrder: true },
    orderBy: { sortOrder: "desc" },
  });

  const nextSortOrder = (lastSection?.sortOrder ?? 0) + 1;

  try {
    await prisma.villageSection.create({
      data: {
        name,
        code: normalizedCode,
        description: description || null,
        sortOrder: nextSortOrder,
        isActive: true,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal membuat seksi desa.",
    };
  }

  revalidatePath("/dashboard/admin/master-data/village-sections");

  return {
    status: "success",
    message: "Seksi desa berhasil dibuat.",
  };
}

export async function toggleVillageSectionStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const sectionId = String(formData.get("section_id") || "");
  const isActive = String(formData.get("is_active") || "") === "true";

  if (!sectionId) {
    return {
      status: "error",
      message: "ID seksi tidak ditemukan.",
    };
  }

  try {
    await prisma.villageSection.update({
      where: { id: sectionId },
      data: { isActive: !isActive },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal mengubah status seksi desa.",
    };
  }

  revalidatePath("/dashboard/admin/master-data/village-sections");

  return {
    status: "success",
    message: isActive
      ? "Seksi desa berhasil dinonaktifkan."
      : "Seksi desa berhasil diaktifkan.",
  };
}

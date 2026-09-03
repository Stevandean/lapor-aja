"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { requireMasterDataManager } from "./shared";

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

  try {
    await prisma.category.create({
      data: {
        name,
        description: description || null,
        isActive: true,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal membuat kategori.",
    };
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

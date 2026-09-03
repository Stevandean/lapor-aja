"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { requireMasterDataManager } from "./shared";

export async function createDusun(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    return {
      status: "error",
      message: "Nama dusun wajib diisi.",
    };
  }

  try {
    await prisma.dusun.create({
      data: {
        name,
        description: description || null,
        isActive: true,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal membuat dusun.",
    };
  }

  revalidatePath("/dashboard/admin/master-data/dusuns");
  revalidatePath("/dashboard/village/users");

  return {
    status: "success",
    message: "Dusun berhasil dibuat.",
  };
}

export async function updateDusun(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const dusunId = String(formData.get("dusun_id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!dusunId) {
    return {
      status: "error",
      message: "ID dusun tidak ditemukan.",
    };
  }

  if (!name) {
    return {
      status: "error",
      message: "Nama dusun wajib diisi.",
    };
  }

  try {
    await prisma.dusun.update({
      where: { id: dusunId },
      data: {
        name,
        description: description || null,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memperbarui dusun.",
    };
  }

  revalidatePath("/dashboard/admin/master-data/dusuns");
  revalidatePath("/dashboard/village/users");

  return {
    status: "success",
    message: "Dusun berhasil diperbarui.",
  };
}

export async function toggleDusunStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const dusunId = String(formData.get("dusun_id") || "");
  const action = String(formData.get("action") || "");

  if (!dusunId) {
    return {
      status: "error",
      message: "ID dusun tidak ditemukan.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Aksi dusun tidak valid.",
    };
  }

  try {
    await prisma.dusun.update({
      where: { id: dusunId },
      data: { isActive: action === "activate" },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal mengubah status dusun.",
    };
  }

  revalidatePath("/dashboard/admin/master-data/dusuns");
  revalidatePath("/dashboard/village/users");

  return {
    status: "success",
    message:
      action === "activate"
        ? "Dusun berhasil diaktifkan."
        : "Dusun berhasil dinonaktifkan.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
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

  const supabase = await createClient();

  const { error } = await supabase.from("categories").insert({
    name,
    description: description || null,
    is_active: true,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
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

  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    return {
      status: "error",
      message: error.message,
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

  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({
      is_active: action === "activate",
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    return {
      status: "error",
      message: error.message,
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

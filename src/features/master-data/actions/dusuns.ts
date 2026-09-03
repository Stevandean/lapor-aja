"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
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

  const supabase = await createClient();

  const { error } = await supabase.from("dusuns").insert({
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

  const supabase = await createClient();

  const { error } = await supabase
    .from("dusuns")
    .update({
      name,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dusunId);

  if (error) {
    return {
      status: "error",
      message: error.message,
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

  const supabase = await createClient();

  const { error } = await supabase
    .from("dusuns")
    .update({
      is_active: action === "activate",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dusunId);

  if (error) {
    return {
      status: "error",
      message: error.message,
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

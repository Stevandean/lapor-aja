"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import type { ActionState } from "@/src/types/action";
import { requireMasterDataManager } from "./shared";

export async function createAgency(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const contactPerson = String(formData.get("contact_person") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!name) {
    return {
      status: "error",
      message: "Nama instansi wajib diisi.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("agencies").insert({
    name,
    description: description || null,
    contact_person: contactPerson || null,
    phone: phone || null,
    email: email || null,
    address: address || null,
    is_active: true,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/agencies");

  return {
    status: "success",
    message: "Instansi berhasil dibuat.",
  };
}

export async function updateAgency(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const agencyId = String(formData.get("agency_id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const contactPerson = String(formData.get("contact_person") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!agencyId) {
    return {
      status: "error",
      message: "ID instansi tidak ditemukan.",
    };
  }

  if (!name) {
    return {
      status: "error",
      message: "Nama instansi wajib diisi.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("agencies")
    .update({
      name,
      description: description || null,
      contact_person: contactPerson || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agencyId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/agencies");

  return {
    status: "success",
    message: "Instansi berhasil diperbarui.",
  };
}

export async function toggleAgencyStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const agencyId = String(formData.get("agency_id") || "");
  const action = String(formData.get("action") || "");

  if (!agencyId) {
    return {
      status: "error",
      message: "ID instansi tidak ditemukan.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Aksi instansi tidak valid.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("agencies")
    .update({
      is_active: action === "activate",
      updated_at: new Date().toISOString(),
    })
    .eq("id", agencyId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/agencies");

  return {
    status: "success",
    message:
      action === "activate"
        ? "Instansi berhasil diaktifkan."
        : "Instansi berhasil dinonaktifkan.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
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

  const supabase = await createClient();

  const { data: lastSection } = await supabase
    .from("village_sections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = Number(lastSection?.sort_order || 0) + 1;

  const { error } = await supabase.from("village_sections").insert({
    name,
    code: normalizedCode,
    description: description || null,
    sort_order: nextSortOrder,
    is_active: true,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
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

  const supabase = await createClient();

  const { error } = await supabase
    .from("village_sections")
    .update({
      is_active: !isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sectionId);

  if (error) {
    return {
      status: "error",
      message: error.message,
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

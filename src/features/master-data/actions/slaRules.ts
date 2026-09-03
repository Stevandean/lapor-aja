"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
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

  const supabase = await createClient();

  const { error } = await supabase
    .from("sla_rules")
    .update({
      verification_hours: verificationHours,
      resolution_hours: resolutionHours,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId);

  if (error) {
    return {
      status: "error",
      message: error.message,
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

  const supabase = await createClient();
  const now = new Date().toISOString();

  if (action === "activate") {
    const { data: rule, error: ruleError } = await supabase
      .from("sla_rules")
      .select("id, priority")
      .eq("id", ruleId)
      .maybeSingle();

    if (ruleError || !rule) {
      return {
        status: "error",
        message: ruleError?.message || "Aturan SLA tidak ditemukan.",
      };
    }

    const { error: deactivateSiblingsError } = await supabase
      .from("sla_rules")
      .update({
        is_active: false,
        updated_at: now,
      })
      .eq("priority", rule.priority)
      .neq("id", ruleId);

    if (deactivateSiblingsError) {
      return {
        status: "error",
        message: deactivateSiblingsError.message,
      };
    }
  }

  if (action === "deactivate") {
    const { data: rule, error: ruleError } = await supabase
      .from("sla_rules")
      .select("id, priority")
      .eq("id", ruleId)
      .maybeSingle();

    if (ruleError || !rule) {
      return {
        status: "error",
        message: ruleError?.message || "Aturan SLA tidak ditemukan.",
      };
    }

    const { count, error: activeCountError } = await supabase
      .from("sla_rules")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("priority", rule.priority)
      .eq("is_active", true)
      .neq("id", ruleId);

    if (activeCountError) {
      return {
        status: "error",
        message: activeCountError.message,
      };
    }

    if ((count ?? 0) === 0) {
      return {
        status: "error",
        message:
          "Setiap prioritas harus memiliki minimal satu aturan SLA aktif untuk persetujuan laporan.",
      };
    }
  }

  const { error } = await supabase
    .from("sla_rules")
    .update({
      is_active: action === "activate",
      updated_at: now,
    })
    .eq("id", ruleId);

  if (error) {
    return {
      status: "error",
      message: error.message,
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

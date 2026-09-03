import { createClient } from "@/src/lib/supabase/server";
import { LIST_LIMIT } from "./shared";

export async function getAdminFollowUpReports() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      status,
      priority,
      asset_status,
      authority_level,
      follow_up_type,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number),
      agency:agencies!reports_agency_id_fkey(name)
    `
    )
    .in("status", [
      "classified",
      "handled_by_village",
      "forwarded_to_agency",
      "waiting_budget",
      "in_progress"
    ])
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("Failed to fetch follow-up reports:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getAdminArchivedReports() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      status,
      priority,
      asset_status,
      authority_level,
      follow_up_type,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name),
      reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number),
      agency:agencies!reports_agency_id_fkey(name)
    `
    )
    .eq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("Failed to fetch archived reports:", error.message);
    return [];
  }

  return data ?? [];
}

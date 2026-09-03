import { getProfile } from "@/src/lib/auth/getProfile";
import { calculateEffectiveSlaStatus } from "@/src/lib/sla";
import { createClient } from "@/src/lib/supabase/server";

const MAP_LIMIT = 200;

function countByValueWithFallback(values: (string | null)[], fallback = "not_set") {
  const counts = new Map<string, number>();

  for (const value of values) {
    const key = value || fallback;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getVillageSlaMonitoringData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      totalReports: 0,
      slaStats: [],
      reports: [],
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      status,
      priority,
      sla_status,
      verification_due_at,
      resolution_due_at,
      resolved_at,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch village SLA data:", error.message);

    return {
      totalReports: 0,
      slaStats: [],
      reports: [],
    };
  }

  const reports = (data ?? []).map((report) => ({
    ...report,
    sla_status: calculateEffectiveSlaStatus(report),
  }));

  return {
    totalReports: reports.length,
    slaStats: countByValueWithFallback(
      reports.map((report) => report.sla_status)
    ),
    reports,
  };
}

export async function getVillageHeatmapReports() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      status,
      priority,
      latitude,
      longitude,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("updated_at", { ascending: false })
    .limit(MAP_LIMIT);

  if (error) {
    console.error("Failed to fetch heatmap reports:", error.message);
    return [];
  }

  return data ?? [];
}

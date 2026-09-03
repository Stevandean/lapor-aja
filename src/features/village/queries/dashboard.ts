import { getProfile } from "@/src/lib/auth/getProfile";
import { createClient } from "@/src/lib/supabase/server";

async function getReportCount(filter?: {
  column: string;
  value: string;
}) {
  const supabase = await createClient();

  let query = supabase.from("reports").select("*", {
    count: "exact",
    head: true,
  });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Failed to count village reports:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getVillageDashboardData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      stats: {
        totalReports: 0,
        pendingReports: 0,
        needVerificationReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
        archivedReports: 0,
      },
      recentReports: [],
    };
  }

  const supabase = await createClient();

  const [
    totalReports,
    pendingReports,
    needVerificationReports,
    inProgressReports,
    resolvedReports,
    archivedReports,
  ] = await Promise.all([
    getReportCount(),
    getReportCount({
      column: "status",
      value: "pending",
    }),
    getReportCount({
      column: "status",
      value: "need_verification",
    }),
    getReportCount({
      column: "status",
      value: "in_progress",
    }),
    getReportCount({
      column: "status",
      value: "resolved",
    }),
    getReportCount({
      column: "status",
      value: "archived",
    }),
  ]);

  const { data: recentReports, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      status,
      priority,
      created_at,
      updated_at,
      category:categories(name),
      hamlet:dusuns(name)
    `
    )
    .order("updated_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Failed to fetch recent village reports:", error.message);
  }

  return {
    stats: {
      totalReports,
      pendingReports,
      needVerificationReports,
      inProgressReports,
      resolvedReports,
      archivedReports,
    },
    recentReports: recentReports ?? [],
  };
}

type RelationName = {
  name: string;
};

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "Uncategorized";
  if (Array.isArray(relation)) return relation[0]?.name ?? "Uncategorized";
  return relation.name ?? "Uncategorized";
}

function countByValue(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getVillageAnalyticsData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      totalReports: 0,
      statusStats: [],
      priorityStats: [],
      categoryStats: [],
      hamletStats: [],
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      status,
      priority,
      category:categories(name),
      hamlet:dusuns(name)
    `
    );

  if (error) {
    console.error("Failed to fetch village analytics:", error.message);

    return {
      totalReports: 0,
      statusStats: [],
      priorityStats: [],
      categoryStats: [],
      hamletStats: [],
    };
  }

  const reports = data ?? [];

  return {
    totalReports: reports.length,
    statusStats: countByValue(reports.map((report) => report.status)),
    priorityStats: countByValue(reports.map((report) => report.priority)),
    categoryStats: countByValue(
      reports.map((report) => getRelationName(report.category))
    ),
    hamletStats: countByValue(
      reports.map((report) => getRelationName(report.hamlet))
    ),
  };
}

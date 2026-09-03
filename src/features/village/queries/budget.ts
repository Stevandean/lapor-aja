import { getProfile } from "@/src/lib/auth/getProfile";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { isMissingDatabaseRelationError, uniqueValues } from "./shared";

type VillageBudgetRequestRow = {
  id: string;
  report_id: string;
  summary_note: string;
  total_estimated_budget: number | string | null;
  requested_by: string | null;
  section_id: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
};

function isMissingBudgetReviewSchemaError(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return (
    ["reviewed_by", "reviewed_at", "review_note"].some((column) =>
      message.includes(column)
    ) &&
    (message.includes("schema cache") || message.includes("does not exist"))
  );
}

export async function getVillageBudgetRequestsData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      budgetSchemaReady: true,
      reviewSchemaReady: true,
      stats: {
        totalRequests: 0,
        totalEstimatedBudget: 0,
        waitingBudgetReports: 0,
      },
      requests: [],
    };
  }

  const supabase = createAdminClient();

  const baseBudgetRequestSelect = `
      id,
      report_id,
      summary_note,
      total_estimated_budget,
      requested_by,
      section_id,
      status,
      created_at
      `;

  const reviewBudgetRequestSelect = `
      ${baseBudgetRequestSelect},
      reviewed_by,
      reviewed_at,
      review_note
      `;

  let reviewSchemaReady = true;
  let budgetRequests: VillageBudgetRequestRow[] | null = null;
  let requestsError: { message: string } | null = null;
  const fullResult = await supabase
    .from("report_budget_requests")
    .select(reviewBudgetRequestSelect)
    .order("created_at", { ascending: false })
    .limit(100);

  budgetRequests = fullResult.data as VillageBudgetRequestRow[] | null;
  requestsError = fullResult.error;

  if (requestsError && isMissingBudgetReviewSchemaError(requestsError.message)) {
    reviewSchemaReady = false;

    const fallbackResult = await supabase
      .from("report_budget_requests")
      .select(baseBudgetRequestSelect)
      .order("created_at", { ascending: false })
      .limit(100);

    budgetRequests = fallbackResult.data as VillageBudgetRequestRow[] | null;
    requestsError = fallbackResult.error;
  }

  if (requestsError) {
    if (isMissingDatabaseRelationError(requestsError.message)) {
      return {
        budgetSchemaReady: false,
        reviewSchemaReady: false,
        stats: {
          totalRequests: 0,
          totalEstimatedBudget: 0,
          waitingBudgetReports: 0,
        },
        requests: [],
      };
    }

    console.error("Failed to fetch village budget requests:", requestsError.message);

    return {
      budgetSchemaReady: true,
      reviewSchemaReady,
      stats: {
        totalRequests: 0,
        totalEstimatedBudget: 0,
        waitingBudgetReports: 0,
      },
      requests: [],
    };
  }

  const requestsData = budgetRequests ?? [];
  const reportIds = uniqueValues(
    requestsData.map((request) => request.report_id)
  );
  const requesterIds = uniqueValues(
    requestsData
      .map((request) => request.requested_by)
      .filter((id): id is string => Boolean(id))
  );
  const reviewerIds = uniqueValues(
    requestsData
      .map((request) => request.reviewed_by)
      .filter((id): id is string => Boolean(id))
  );

  const [
    { data: reports, error: reportsError },
    { data: requesters },
    { data: reviewers },
  ] = await Promise.all([
      reportIds.length > 0
        ? supabase
            .from("reports")
            .select(
              `
              id,
              report_number,
              title,
              status,
              priority,
              follow_up_type,
              assigned_section_id,
              updated_at,
              category:categories(name),
              hamlet:dusuns(name)
              `
            )
            .in("id", reportIds)
        : Promise.resolve({ data: [], error: null }),
      requesterIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, full_name, email, section_id")
            .in("id", requesterIds)
        : Promise.resolve({ data: [], error: null }),
      reviewerIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", reviewerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (reportsError) {
    console.error(
      "Failed to fetch reports for village budget requests:",
      reportsError.message
    );
  }

  const sectionIds = uniqueValues([
    ...requestsData
      .map((request) => request.section_id)
      .filter((id): id is string => Boolean(id)),
  ]);

  const { data: sections } =
    sectionIds.length > 0
      ? await supabase
          .from("village_sections")
          .select("id, name")
          .in("id", sectionIds)
      : { data: [] };

  const reportById = new Map((reports ?? []).map((report) => [report.id, report]));
  const requesterById = new Map(
    (requesters ?? []).map((requester) => [requester.id, requester])
  );
  const reviewerById = new Map(
    (reviewers ?? []).map((reviewer) => [reviewer.id, reviewer])
  );
  const sectionById = new Map(
    (sections ?? []).map((section) => [section.id, section])
  );

  const requestIds = requestsData.map((request) => request.id);
  const { data: items } =
    requestIds.length > 0
      ? await supabase
          .from("report_budget_request_items")
          .select("id, budget_request_id")
          .in("budget_request_id", requestIds)
      : { data: [] };

  const requests = requestsData.map((request) => {
    const report = reportById.get(request.report_id) ?? null;
    const requester = request.requested_by
      ? requesterById.get(request.requested_by) ?? null
      : null;
    const reviewer = request.reviewed_by
      ? reviewerById.get(request.reviewed_by) ?? null
      : null;
    const sectionId = request.section_id ?? report?.assigned_section_id ?? null;

    return {
      id: request.id,
      note: request.summary_note,
      estimated_budget: Number(request.total_estimated_budget || 0),
      status: request.status,
      created_at: request.created_at,
      reviewed_at: request.reviewed_at ?? null,
      review_note: request.review_note ?? null,
      report,
      requester,
      reviewer,
      section: sectionId ? sectionById.get(sectionId) ?? null : null,
      itemCount: (items ?? []).filter(
        (item) => item.budget_request_id === request.id
      ).length,
    };
  });

  return {
    budgetSchemaReady: true,
    reviewSchemaReady,
    stats: {
      totalRequests: requests.length,
      totalEstimatedBudget: requests.reduce(
        (sum, request) => sum + request.estimated_budget,
        0
      ),
      waitingBudgetReports: requests.filter(
        (request) => request.report?.status === "waiting_budget"
      ).length,
    },
    requests,
  };
}

export async function getVillageBudgetRequestDetail(requestId: string) {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return null;
  }

  const supabase = createAdminClient();
  const baseSelect = `
    id,
    report_id,
    summary_note,
    total_estimated_budget,
    requested_by,
    section_id,
    status,
    created_at,
    updated_at
  `;
  const reviewSelect = `
    ${baseSelect},
    reviewed_by,
    reviewed_at,
    review_note
  `;

  let reviewSchemaReady = true;
  let request: VillageBudgetRequestRow | null = null;
  let requestError: { message: string } | null = null;
  const fullResult = await supabase
    .from("report_budget_requests")
    .select(reviewSelect)
    .eq("id", requestId)
    .maybeSingle();

  request = fullResult.data as VillageBudgetRequestRow | null;
  requestError = fullResult.error;

  if (requestError && isMissingBudgetReviewSchemaError(requestError.message)) {
    reviewSchemaReady = false;

    const fallback = await supabase
      .from("report_budget_requests")
      .select(baseSelect)
      .eq("id", requestId)
      .maybeSingle();

    request = fallback.data as VillageBudgetRequestRow | null;
    requestError = fallback.error;
  }

  if (requestError) {
    if (!isMissingDatabaseRelationError(requestError.message)) {
      console.error("Failed to fetch budget request detail:", requestError.message);
    }

    return null;
  }

  if (!request) {
    return null;
  }

  const [
    { data: report, error: reportError },
    { data: requester },
    { data: reviewer },
    { data: section },
    { data: items, error: itemsError },
  ] = await Promise.all([
    supabase
      .from("reports")
      .select(
        `
        id,
        report_number,
        title,
        description,
        status,
        priority,
        follow_up_type,
        asset_status,
        authority_level,
        internal_handling_note,
        created_at,
        updated_at,
        category:categories(name),
        hamlet:dusuns(name),
        reporter:profiles!reports_reporter_id_fkey(full_name, email, phone_number)
        `
      )
      .eq("id", request.report_id)
      .maybeSingle(),
    request.requested_by
      ? supabase
          .from("profiles")
          .select("id, full_name, email, phone_number")
          .eq("id", request.requested_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    request.reviewed_by
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", request.reviewed_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    request.section_id
      ? supabase
          .from("village_sections")
          .select("id, name")
          .eq("id", request.section_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("report_budget_request_items")
      .select(
        `
        id,
        item_name,
        description,
        quantity,
        unit,
        unit_price,
        subtotal,
        created_at
        `
      )
      .eq("budget_request_id", request.id)
      .order("created_at", { ascending: true }),
  ]);

  if (reportError) {
    console.error("Failed to fetch report for budget request detail:", reportError.message);
  }

  if (itemsError) {
    console.error("Failed to fetch budget request items:", itemsError.message);
  }

  return {
    budgetSchemaReady: true,
    reviewSchemaReady,
    request: {
      id: request.id,
      note: request.summary_note,
      estimated_budget: Number(request.total_estimated_budget || 0),
      status: request.status,
      created_at: request.created_at,
      updated_at: request.updated_at,
      reviewed_at: request.reviewed_at ?? null,
      review_note: request.review_note ?? null,
      report,
      requester,
      reviewer,
      section,
      items: (items ?? []).map((item) => ({
        ...item,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        subtotal: Number(item.subtotal || 0),
      })),
    },
  };
}

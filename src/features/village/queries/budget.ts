import { getProfile } from "@/src/lib/auth/getProfile";
import { prisma } from "@/src/lib/prisma";

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

  const budgetRequests = await prisma.reportBudgetRequest.findMany({
    select: {
      id: true,
      reportId: true,
      summaryNote: true,
      totalEstimatedBudget: true,
      requestedBy: true,
      sectionId: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
      reviewNote: true,
      report: {
        select: {
          id: true,
          reportNumber: true,
          title: true,
          status: true,
          priority: true,
          followUpType: true,
          assignedSectionId: true,
          updatedAt: true,
          category: { select: { name: true } },
          dusun: { select: { name: true } },
          assignedSection: { select: { id: true, name: true } },
        },
      },
      requester: { select: { id: true, fullName: true, email: true, sectionId: true } },
      reviewer: { select: { id: true, fullName: true, email: true } },
      section: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const requests = budgetRequests.map((request) => {
    const section = request.section ?? request.report.assignedSection ?? null;

    return {
      id: request.id,
      note: request.summaryNote,
      estimated_budget: Number(request.totalEstimatedBudget || 0),
      status: request.status,
      created_at: request.createdAt.toISOString(),
      reviewed_at: request.reviewedAt?.toISOString() ?? null,
      review_note: request.reviewNote,
      report: {
        id: request.report.id,
        report_number: request.report.reportNumber,
        title: request.report.title,
        status: request.report.status,
        priority: request.report.priority,
        follow_up_type: request.report.followUpType,
        assigned_section_id: request.report.assignedSectionId,
        updated_at: request.report.updatedAt.toISOString(),
        category: request.report.category,
        hamlet: request.report.dusun,
      },
      requester: request.requester
        ? {
            id: request.requester.id,
            full_name: request.requester.fullName,
            email: request.requester.email,
            section_id: request.requester.sectionId,
          }
        : null,
      reviewer: request.reviewer
        ? {
            id: request.reviewer.id,
            full_name: request.reviewer.fullName,
            email: request.reviewer.email,
          }
        : null,
      section,
      itemCount: request._count.items,
    };
  });

  return {
    budgetSchemaReady: true,
    reviewSchemaReady: true,
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

  const request = await prisma.reportBudgetRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      summaryNote: true,
      totalEstimatedBudget: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      reviewedAt: true,
      reviewNote: true,
      report: {
        select: {
          id: true,
          reportNumber: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          followUpType: true,
          assetStatus: true,
          authorityLevel: true,
          internalHandlingNote: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { name: true } },
          dusun: { select: { name: true } },
          reporter: { select: { fullName: true, email: true, phoneNumber: true } },
        },
      },
      requester: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      reviewer: { select: { id: true, fullName: true, email: true } },
      section: { select: { id: true, name: true } },
      items: {
        select: {
          id: true,
          itemName: true,
          description: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          subtotal: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) {
    return null;
  }

  return {
    budgetSchemaReady: true,
    reviewSchemaReady: true,
    request: {
      id: request.id,
      note: request.summaryNote,
      estimated_budget: Number(request.totalEstimatedBudget || 0),
      status: request.status,
      created_at: request.createdAt.toISOString(),
      updated_at: request.updatedAt.toISOString(),
      reviewed_at: request.reviewedAt?.toISOString() ?? null,
      review_note: request.reviewNote,
      report: {
        id: request.report.id,
        report_number: request.report.reportNumber,
        title: request.report.title,
        description: request.report.description,
        status: request.report.status,
        priority: request.report.priority,
        follow_up_type: request.report.followUpType,
        asset_status: request.report.assetStatus,
        authority_level: request.report.authorityLevel,
        internal_handling_note: request.report.internalHandlingNote,
        created_at: request.report.createdAt.toISOString(),
        updated_at: request.report.updatedAt.toISOString(),
        category: request.report.category,
        hamlet: request.report.dusun,
        reporter: request.report.reporter
          ? {
              full_name: request.report.reporter.fullName,
              email: request.report.reporter.email,
              phone_number: request.report.reporter.phoneNumber,
            }
          : null,
      },
      requester: request.requester
        ? {
            id: request.requester.id,
            full_name: request.requester.fullName,
            email: request.requester.email,
            phone_number: request.requester.phoneNumber,
          }
        : null,
      reviewer: request.reviewer
        ? {
            id: request.reviewer.id,
            full_name: request.reviewer.fullName,
            email: request.reviewer.email,
          }
        : null,
      section: request.section,
      items: request.items.map((item) => ({
        id: item.id,
        item_name: item.itemName,
        description: item.description,
        quantity: Number(item.quantity || 0),
        unit: item.unit,
        unit_price: Number(item.unitPrice || 0),
        subtotal: Number(item.subtotal || 0),
        created_at: item.createdAt.toISOString(),
      })),
    },
  };
}

import { prisma } from "@/src/lib/prisma";
import type {
  ReportStatus,
  ReportPriority,
  AssetStatus,
  AuthorityLevel,
  FollowUpType,
} from "@prisma/client";
import { LIST_LIMIT } from "./shared";

const followUpReportSelect = {
  id: true,
  reportNumber: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  assetStatus: true,
  authorityLevel: true,
  followUpType: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { name: true } },
  dusun: { select: { name: true } },
  reporter: { select: { fullName: true, email: true, phoneNumber: true } },
  agency: { select: { name: true } },
} as const;

function mapFollowUpReport(report: {
  id: string;
  reportNumber: string;
  title: string;
  description: string;
  status: ReportStatus;
  priority: ReportPriority;
  assetStatus: AssetStatus;
  authorityLevel: AuthorityLevel;
  followUpType: FollowUpType;
  createdAt: Date;
  updatedAt: Date;
  category: { name: string } | null;
  dusun: { name: string } | null;
  reporter: { fullName: string; email: string; phoneNumber: string | null } | null;
  agency: { name: string } | null;
}) {
  return {
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    description: report.description,
    status: report.status,
    priority: report.priority,
    asset_status: report.assetStatus,
    authority_level: report.authorityLevel,
    follow_up_type: report.followUpType,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
    category: report.category,
    hamlet: report.dusun,
    reporter: report.reporter
      ? {
          full_name: report.reporter.fullName,
          email: report.reporter.email,
          phone_number: report.reporter.phoneNumber,
        }
      : null,
    agency: report.agency,
  };
}

export async function getAdminFollowUpReports() {
  const reports = await prisma.report.findMany({
    where: {
      status: {
        in: [
          "classified",
          "handled_by_village",
          "forwarded_to_agency",
          "waiting_budget",
          "in_progress",
        ],
      },
    },
    select: followUpReportSelect,
    orderBy: { updatedAt: "desc" },
    take: LIST_LIMIT,
  });

  return reports.map(mapFollowUpReport);
}

export async function getAdminArchivedReports() {
  const reports = await prisma.report.findMany({
    where: { status: "archived" },
    select: followUpReportSelect,
    orderBy: { updatedAt: "desc" },
    take: LIST_LIMIT,
  });

  return reports.map(mapFollowUpReport);
}

import { getProfile } from "@/src/lib/auth/getProfile";
import { prisma } from "@/src/lib/prisma";

const LIST_LIMIT = 50;

function toDisplayUrl(filePath: string | null | undefined) {
  return filePath && filePath.startsWith("/") ? filePath : null;
}

export async function getHamletHeadVerificationReports() {
  const profile = await getProfile();

  if (!profile) {
    return {
      reports: [],
      missingHamlet: false,
    };
  }

  if (profile.role !== "kepala_dusun") {
    return {
      reports: [],
      missingHamlet: false,
    };
  }

  if (!profile.dusun_id) {
    return {
      reports: [],
      missingHamlet: true,
    };
  }

  const reports = await prisma.report.findMany({
    where: { status: "need_verification", dusunId: profile.dusun_id },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });

  return {
    reports: reports.map((report) => ({
      id: report.id,
      report_number: report.reportNumber,
      title: report.title,
      description: report.description,
      status: report.status,
      priority: report.priority,
      created_at: report.createdAt.toISOString(),
      categories: report.category,
      dusuns: report.dusun,
    })),
    missingHamlet: false,
  };
}

export async function getHamletHeadVerificationReportDetail(reportId: string) {
  const profile = await getProfile();

  if (!profile || profile.role !== "kepala_dusun" || !profile.dusun_id) {
    return null;
  }

  const report = await prisma.report.findFirst({
    where: { id: reportId, dusunId: profile.dusun_id },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      latitude: true,
      longitude: true,
      autoAddress: true,
      manualAddress: true,
      adminNote: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
      reporter: { select: { fullName: true, email: true, phoneNumber: true } },
    },
  });

  if (!report) {
    return null;
  }

  const photos = await prisma.reportPhoto.findMany({
    where: { reportId },
    select: { id: true, filePath: true, photoUrl: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const photosWithSignedUrls = photos.map((photo) => ({
    id: photo.id,
    file_path: photo.filePath,
    photo_url: photo.photoUrl,
    created_at: photo.createdAt.toISOString(),
    signedUrl: toDisplayUrl(photo.filePath),
  }));

  return {
    report: {
      id: report.id,
      report_number: report.reportNumber,
      title: report.title,
      description: report.description,
      status: report.status,
      priority: report.priority,
      latitude: Number(report.latitude),
      longitude: Number(report.longitude),
      auto_address: report.autoAddress,
      manual_address: report.manualAddress,
      admin_note: report.adminNote,
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
    },
    photos: photosWithSignedUrls,
  };
}

export async function getHamletHeadDashboardData() {
  const profile = await getProfile();

  if (!profile || profile.role !== "kepala_dusun") {
    return {
      missingHamlet: false,
      stats: {
        totalAssignedReports: 0,
        needVerificationReports: 0,
        verifiedValidReports: 0,
        verifiedInvalidReports: 0,
        resolvedReports: 0,
      },
      recentReports: [],
    };
  }

  if (!profile.dusun_id) {
    return {
      missingHamlet: true,
      stats: {
        totalAssignedReports: 0,
        needVerificationReports: 0,
        verifiedValidReports: 0,
        verifiedInvalidReports: 0,
        resolvedReports: 0,
      },
      recentReports: [],
    };
  }

  const dusunId = profile.dusun_id;

  const [
    totalAssignedReports,
    needVerificationReports,
    verifiedValidReports,
    verifiedInvalidReports,
    resolvedReports,
    recentReports,
  ] = await Promise.all([
    prisma.report.count({ where: { dusunId } }),
    prisma.report.count({ where: { dusunId, status: "need_verification" } }),
    prisma.report.count({ where: { dusunId, status: "verified_valid" } }),
    prisma.report.count({ where: { dusunId, status: "verified_invalid" } }),
    prisma.report.count({ where: { dusunId, status: "resolved" } }),
    prisma.report.findMany({
      where: { dusunId },
      select: {
        id: true,
        reportNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    missingHamlet: false,
    stats: {
      totalAssignedReports,
      needVerificationReports,
      verifiedValidReports,
      verifiedInvalidReports,
      resolvedReports,
    },
    recentReports: recentReports.map((report) => ({
      id: report.id,
      report_number: report.reportNumber,
      title: report.title,
      status: report.status,
      priority: report.priority,
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
      category: report.category,
    })),
  };
}

export async function getHamletHeadVerificationHistory() {
  const profile = await getProfile();

  if (!profile || profile.role !== "kepala_dusun") {
    return {
      missingHamlet: false,
      history: [],
    };
  }

  if (!profile.dusun_id) {
    return {
      missingHamlet: true,
      history: [],
    };
  }

  const verifications = await prisma.reportVerification.findMany({
    where: { verifiedBy: profile.id },
    select: { id: true, reportId: true, isValid: true, verificationNote: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });

  const latestVerificationByReportId = new Map<
    string,
    {
      id: string;
      report_id: string;
      is_valid: boolean;
      verification_note: string | null;
      created_at: string;
    }
  >();

  for (const verification of verifications) {
    if (!verification.reportId) continue;

    if (!latestVerificationByReportId.has(verification.reportId)) {
      latestVerificationByReportId.set(verification.reportId, {
        id: verification.id,
        report_id: verification.reportId,
        is_valid: verification.isValid,
        verification_note: verification.verificationNote,
        created_at: verification.createdAt.toISOString(),
      });
    }
  }

  const uniqueVerifications = Array.from(latestVerificationByReportId.values());
  const reportIds = uniqueVerifications.map((verification) => verification.report_id);

  if (reportIds.length === 0) {
    return {
      missingHamlet: false,
      history: [],
    };
  }

  const reports = await prisma.report.findMany({
    where: { id: { in: reportIds }, dusunId: profile.dusun_id },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      priority: true,
      updatedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
    },
    take: LIST_LIMIT,
  });

  const reportRows = reports.map((report) => ({
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    priority: report.priority,
    updated_at: report.updatedAt.toISOString(),
    category: report.category,
    hamlet: report.dusun,
  }));

  const reportMap = new Map(reportRows.map((report) => [report.id, report]));

  const history = uniqueVerifications
    .map((verification) => {
      const report = reportMap.get(verification.report_id);

      if (!report) return null;

      return {
        verification,
        report,
      };
    })
    .filter(
      (item): item is { verification: (typeof uniqueVerifications)[number]; report: (typeof reportRows)[number] } =>
        item !== null
    );

  return {
    missingHamlet: false,
    history,
  };
}

export async function getHamletHeadAssignedReports() {
  const profile = await getProfile();

  if (!profile || profile.role !== "kepala_dusun") {
    return {
      missingHamlet: false,
      reports: [],
    };
  }

  if (!profile.dusun_id) {
    return {
      missingHamlet: true,
      reports: [],
    };
  }

  const reports = await prisma.report.findMany({
    where: { dusunId: profile.dusun_id },
    select: {
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
    },
    orderBy: { updatedAt: "desc" },
    take: LIST_LIMIT,
  });

  return {
    missingHamlet: false,
    reports: reports.map((report) => ({
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
    })),
  };
}

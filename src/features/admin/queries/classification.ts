import { prisma } from "@/src/lib/prisma";
import { LIST_LIMIT } from "./shared";

function toDisplayUrl(filePath: string | null | undefined) {
  return filePath && filePath.startsWith("/") ? filePath : null;
}

export async function getAdminAssetClassificationReports() {
  const reports = await prisma.report.findMany({
    where: { status: "verified_valid" },
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

  return reports.map((report) => ({
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
  }));
}

export async function getAdminAssetClassificationReportDetail(reportId: string) {
  const report = await prisma.report.findFirst({
    where: { id: reportId, status: { in: ["verified_valid", "classified"] } },
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
      assignedSectionId: true,
      latitude: true,
      longitude: true,
      adminNote: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      dusun: { select: { name: true } },
      reporter: { select: { fullName: true, email: true, phoneNumber: true } },
      agency: { select: { name: true } },
    },
  });

  if (!report) {
    return null;
  }

  const reportPhotos = await prisma.reportPhoto.findMany({
    where: { reportId },
    select: { id: true, filePath: true, photoUrl: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const reportPhotosWithSignedUrls = reportPhotos.map((photo) => ({
    id: photo.id,
    file_path: photo.filePath,
    photo_url: photo.photoUrl,
    created_at: photo.createdAt.toISOString(),
    signedUrl: toDisplayUrl(photo.filePath),
  }));

  const verification = await prisma.reportVerification.findFirst({
    where: { reportId },
    select: { id: true, isValid: true, verificationNote: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  let verificationPhotosWithSignedUrls: {
    id: string;
    file_path: string;
    photo_url: string;
    created_at: string;
    signedUrl: string | null;
  }[] = [];

  if (verification) {
    const verificationPhotos = await prisma.verificationPhoto.findMany({
      where: { verificationId: verification.id },
      select: { id: true, filePath: true, photoUrl: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    verificationPhotosWithSignedUrls = verificationPhotos.map((photo) => ({
      id: photo.id,
      file_path: photo.filePath,
      photo_url: photo.photoUrl,
      created_at: photo.createdAt.toISOString(),
      signedUrl: toDisplayUrl(photo.filePath),
    }));
  }

  return {
    report: {
      id: report.id,
      report_number: report.reportNumber,
      title: report.title,
      description: report.description,
      status: report.status,
      priority: report.priority,
      asset_status: report.assetStatus,
      authority_level: report.authorityLevel,
      follow_up_type: report.followUpType,
      assigned_section_id: report.assignedSectionId,
      latitude: Number(report.latitude),
      longitude: Number(report.longitude),
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
      agency: report.agency,
    },
    reportPhotos: reportPhotosWithSignedUrls,
    verification: verification
      ? {
          id: verification.id,
          is_valid: verification.isValid,
          verification_note: verification.verificationNote,
          created_at: verification.createdAt.toISOString(),
        }
      : null,
    verificationPhotos: verificationPhotosWithSignedUrls,
  };
}

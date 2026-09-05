import { prisma } from "@/src/lib/prisma";

export async function getOfficialLetterByReportId(reportId: string) {
  const letter = await prisma.officialLetter.findFirst({
    where: { reportId, letterType: "surat_permohonan_perbaikan" },
    select: {
      id: true,
      reportId: true,
      letterType: true,
      letterNumber: true,
      subject: true,
      body: true,
      recipientAgencyId: true,
      generatedBy: true,
      generatedAt: true,
      signedBy: true,
      signedAt: true,
      pdfUrl: true,
      filePath: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!letter) {
    return null;
  }

  return {
    id: letter.id,
    report_id: letter.reportId,
    letter_type: letter.letterType,
    letter_number: letter.letterNumber,
    subject: letter.subject,
    body: letter.body,
    recipient_agency_id: letter.recipientAgencyId,
    generated_by: letter.generatedBy,
    generated_at: letter.generatedAt.toISOString(),
    signed_by: letter.signedBy,
    signed_at: letter.signedAt?.toISOString() ?? null,
    pdf_url: letter.pdfUrl,
    file_path: letter.filePath,
    status: letter.status,
    created_at: letter.createdAt.toISOString(),
    updated_at: letter.updatedAt.toISOString(),
  };
}

export async function getReportsReadyForOfficialLetter() {
  const existingLetters = await prisma.officialLetter.findMany({
    where: { letterType: "surat_permohonan_perbaikan" },
    select: { reportId: true },
  });

  const existingReportIds = new Set(existingLetters.map((letter) => letter.reportId));

  const reports = await prisma.report.findMany({
    where: {
      status: "forwarded_to_agency",
      agencyId: { not: null },
      id: { notIn: Array.from(existingReportIds) },
    },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      description: true,
      status: true,
      agencyId: true,
      updatedAt: true,
      agency: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return reports.map((report) => ({
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    description: report.description,
    status: report.status,
    agency_id: report.agencyId,
    updated_at: report.updatedAt.toISOString(),
    agency: report.agency,
  }));
}

export async function getGeneratedOfficialLetters() {
  const letters = await prisma.officialLetter.findMany({
    where: { letterType: "surat_permohonan_perbaikan" },
    select: {
      id: true,
      reportId: true,
      letterType: true,
      letterNumber: true,
      subject: true,
      body: true,
      recipientAgencyId: true,
      generatedAt: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      report: {
        select: { id: true, reportNumber: true, title: true, status: true },
      },
      recipientAgency: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return letters.map((letter) => ({
    id: letter.id,
    report_id: letter.reportId,
    letter_type: letter.letterType,
    letter_number: letter.letterNumber,
    subject: letter.subject,
    body: letter.body,
    recipient_agency_id: letter.recipientAgencyId,
    generated_at: letter.generatedAt.toISOString(),
    status: letter.status,
    created_at: letter.createdAt.toISOString(),
    updated_at: letter.updatedAt.toISOString(),
    report: letter.report
      ? {
          id: letter.report.id,
          report_number: letter.report.reportNumber,
          title: letter.report.title,
          status: letter.report.status,
        }
      : null,
    agency: letter.recipientAgency,
  }));
}

export async function getOfficialLetterDetail(letterId: string) {
  const letter = await prisma.officialLetter.findUnique({
    where: { id: letterId },
    select: {
      id: true,
      reportId: true,
      letterType: true,
      letterNumber: true,
      subject: true,
      body: true,
      recipientAgencyId: true,
      generatedAt: true,
      pdfUrl: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      report: {
        select: {
          id: true,
          reportNumber: true,
          title: true,
          description: true,
          status: true,
          manualAddress: true,
          autoAddress: true,
          latitude: true,
          longitude: true,
        },
      },
      recipientAgency: {
        select: {
          id: true,
          name: true,
          address: true,
          contactPerson: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!letter) {
    return null;
  }

  return {
    id: letter.id,
    report_id: letter.reportId,
    letter_type: letter.letterType,
    letter_number: letter.letterNumber,
    subject: letter.subject,
    body: letter.body,
    recipient_agency_id: letter.recipientAgencyId,
    generated_at: letter.generatedAt.toISOString(),
    pdf_url: letter.pdfUrl,
    status: letter.status,
    created_at: letter.createdAt.toISOString(),
    updated_at: letter.updatedAt.toISOString(),
    report: letter.report
      ? {
          id: letter.report.id,
          report_number: letter.report.reportNumber,
          title: letter.report.title,
          description: letter.report.description,
          status: letter.report.status,
          manual_address: letter.report.manualAddress,
          auto_address: letter.report.autoAddress,
          latitude: Number(letter.report.latitude),
          longitude: Number(letter.report.longitude),
        }
      : null,
    agency: letter.recipientAgency
      ? {
          id: letter.recipientAgency.id,
          name: letter.recipientAgency.name,
          address: letter.recipientAgency.address,
          contact_person: letter.recipientAgency.contactPerson,
          phone: letter.recipientAgency.phone,
          email: letter.recipientAgency.email,
        }
      : null,
  };
}

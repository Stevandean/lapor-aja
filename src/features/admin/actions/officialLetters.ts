"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { sendOfficialLetterViaBrevo } from "@/src/lib/email/sendEmail";
import { generateOfficialLetterPdf } from "@/src/features/admin/officialLetterPdf";
import { requireAdmin } from "./shared";

export async function createOfficialLetter(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireAdmin();

  const reportId = String(formData.get("report_id") || "");

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  const existingLetter = await prisma.officialLetter.findFirst({
    where: { reportId, letterType: "surat_permohonan_perbaikan" },
    select: { id: true },
  });

  if (existingLetter) {
    return {
      status: "error",
      message: "Surat resmi untuk laporan ini sudah ada.",
    };
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      description: true,
      status: true,
      agencyId: true,
      autoAddress: true,
      manualAddress: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!report) {
    return {
      status: "error",
      message: "Laporan tidak ditemukan.",
    };
  }

  if (report.status !== "forwarded_to_agency") {
    return {
      status: "error",
      message:
        "Surat resmi hanya bisa dibuat untuk laporan yang diteruskan ke instansi.",
    };
  }

  if (!report.agencyId) {
    return {
      status: "error",
      message: "Instansi tujuan belum dipilih untuk laporan ini.",
    };
  }

  const agency = await prisma.agency.findUnique({
    where: { id: report.agencyId },
    select: { id: true, name: true, address: true },
  });

  if (!agency) {
    return {
      status: "error",
      message: "Instansi tujuan tidak ditemukan.",
    };
  }

  const letterNumber = generateOfficialLetterNumber(report.reportNumber);

  const subject = `Permohonan Perbaikan Tindak Lanjut Laporan ${report.reportNumber}`;

  const location =
    report.manualAddress ||
    report.autoAddress ||
    `Latitude ${report.latitude}, Longitude ${report.longitude}`;

  const body = [
    "Kepada Yth.",
    agency.name,
    agency.address ? `Alamat: ${agency.address}` : "",
    "",
    "Dengan hormat,",
    "",
    `Sehubungan dengan adanya laporan masyarakat melalui Sistem Lapor Aja dengan nomor laporan ${report.reportNumber}, Pemerintah Desa bermaksud menyampaikan permohonan tindak lanjut kepada ${agency.name}.`,
    "",
    "Adapun ringkasan laporan adalah sebagai berikut:",
    `Judul Laporan: ${report.title}`,
    `Lokasi: ${location}`,
    `Deskripsi: ${report.description}`,
    "",
    "Berdasarkan hasil peninjauan dan klasifikasi, laporan tersebut berada di luar kewenangan langsung Pemerintah Desa sehingga perlu diteruskan kepada instansi terkait untuk mendapatkan penanganan lebih lanjut.",
    "",
    "Demikian surat permohonan ini dibuat. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
  ]
    .filter(Boolean)
    .join("\n");

  let letter;

  try {
    letter = await prisma.officialLetter.create({
      data: {
        reportId: report.id,
        letterType: "surat_permohonan_perbaikan",
        letterNumber,
        subject,
        body,
        recipientAgencyId: agency.id,
        generatedBy: profile.id,
        status: "draft",
      },
      select: { id: true },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal membuat surat resmi.",
    };
  }

  // PDF di-generate sekali di sini (isi surat tidak pernah berubah lagi
  // setelah dibuat — tidak ada aksi "edit" body/subject) — finalizeOfficialLetter
  // cuma jadi jaring pengaman kalau untuk suatu alasan baris ini belum
  // punya PDF saat difinalkan.
  try {
    const pdfPath = await generateOfficialLetterPdf({
      letterId: letter.id,
      letterNumber,
      subject,
      body,
    });

    await prisma.officialLetter.update({
      where: { id: letter.id },
      data: { pdfUrl: pdfPath, filePath: pdfPath },
    });
  } catch (error) {
    console.error("Failed to generate official letter PDF:", error);
  }

  revalidatePath("/dashboard/admin/letters");

  return {
    status: "success",
    message: "Draf surat resmi berhasil dibuat.",
  };
}

function generateOfficialLetterNumber(reportNumber: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = toRomanMonth(now.getMonth() + 1);

  return `SPP/${reportNumber}/${month}/${year}`;
}

function toRomanMonth(month: number) {
  const romanMonths: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
  };

  return romanMonths[month] ?? String(month);
}

export async function finalizeOfficialLetter(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const letterId = String(formData.get("letter_id") || "");

  if (!letterId) {
    return {
      status: "error",
      message: "ID surat tidak ditemukan.",
    };
  }

  const letter = await prisma.officialLetter.findUnique({
    where: { id: letterId },
    select: {
      id: true,
      status: true,
      letterNumber: true,
      subject: true,
      body: true,
      pdfUrl: true,
    },
  });

  if (!letter) {
    return {
      status: "error",
      message: "Surat resmi tidak ditemukan.",
    };
  }

  if (letter.status === "sent") {
    return {
      status: "error",
      message: "Surat yang sudah terkirim tidak bisa diubah.",
    };
  }

  if (letter.status === "final") {
    return {
      status: "success",
      message: "Surat resmi sudah berstatus final.",
    };
  }

  try {
    await prisma.officialLetter.update({
      where: { id: letterId },
      data: { status: "final" },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menandai surat resmi final.",
    };
  }

  // Jaring pengaman: harusnya PDF sudah ada sejak createOfficialLetter,
  // tapi kalau untuk suatu alasan belum (mis. generate sempat gagal),
  // coba lagi di sini supaya surat final tetap punya PDF yang bisa diunduh.
  if (!letter.pdfUrl) {
    try {
      const pdfPath = await generateOfficialLetterPdf({
        letterId: letter.id,
        letterNumber: letter.letterNumber,
        subject: letter.subject,
        body: letter.body ?? "",
      });

      await prisma.officialLetter.update({
        where: { id: letterId },
        data: { pdfUrl: pdfPath, filePath: pdfPath },
      });
    } catch (error) {
      console.error("Failed to generate official letter PDF on finalize:", error);
    }
  }

  revalidatePath("/dashboard/admin/letters");
  revalidatePath(`/dashboard/admin/letters/${letterId}`);

  return {
    status: "success",
    message: "Surat resmi berhasil ditandai final.",
  };
}

export async function sendOfficialLetterEmail(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const letterId = String(formData.get("letter_id") || "");

  if (!letterId) {
    return {
      status: "error",
      message: "ID surat tidak ditemukan.",
    };
  }

  const letter = await prisma.officialLetter.findUnique({
    where: { id: letterId },
    select: {
      id: true,
      reportId: true,
      letterNumber: true,
      subject: true,
      body: true,
      recipientAgencyId: true,
      status: true,
    },
  });

  if (!letter) {
    return {
      status: "error",
      message: "Surat resmi tidak ditemukan.",
    };
  }

  if (letter.status === "draft") {
    return {
      status: "error",
      message: "Tandai surat resmi sebagai final sebelum mengirimnya.",
    };
  }

  if (letter.status === "sent") {
    return {
      status: "error",
      message: "Surat resmi ini sudah terkirim.",
    };
  }

  if (!letter.recipientAgencyId) {
    return {
      status: "error",
      message: "Instansi penerima tidak ditemukan.",
    };
  }

  const report = await prisma.report.findUnique({
    where: { id: letter.reportId },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      description: true,
      manualAddress: true,
      autoAddress: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!report) {
    return {
      status: "error",
      message: "Laporan terkait tidak ditemukan.",
    };
  }

  const agency = await prisma.agency.findUnique({
    where: { id: letter.recipientAgencyId },
    select: { id: true, name: true, email: true, isActive: true },
  });

  if (!agency) {
    return {
      status: "error",
      message: "Instansi penerima tidak ditemukan.",
    };
  }

  if (!agency.isActive) {
    return {
      status: "error",
      message: "Instansi penerima tidak aktif.",
    };
  }

  if (!agency.email) {
    return {
      status: "error",
      message: "Instansi penerima belum memiliki alamat email.",
    };
  }

  const location =
    report.manualAddress ||
    report.autoAddress ||
    `Latitude ${report.latitude}, Longitude ${report.longitude}`;

  try {
    await sendOfficialLetterViaBrevo({
      agencyEmail: agency.email,
      agencyName: agency.name,
      letterNumber: letter.letterNumber ?? "",
      letterSubject: letter.subject,
      letterBody: letter.body ?? "",
      reportNumber: report.reportNumber,
      reportTitle: report.title,
      reportDescription: report.description,
      reportAddress: location,
    });

    try {
      await prisma.notification.create({
        data: {
          userId: null,
          reportId: report.id,
          recipientEmail: agency.email,
          subject: letter.subject,
          message: `Surat resmi ${letter.letterNumber || letter.subject} sudah dikirim ke ${agency.name}.`,
          status: "sent",
          sentAt: new Date(),
        },
      });
    } catch (notificationError) {
      console.error("Failed to create sent notification:", notificationError);
    }

    await prisma.officialLetter.update({
      where: { id: letter.id },
      data: { status: "sent" },
    });

    await prisma.report.update({
      where: { id: report.id },
      data: { status: "forwarded_to_agency" },
    });

    revalidatePath("/dashboard/admin/letters");
    revalidatePath(`/dashboard/admin/letters/${letter.id}`);

    return {
      status: "success",
      message: `Surat resmi berhasil dikirim ke ${agency.name}.`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Gagal mengirim email surat resmi.";

    try {
      await prisma.notification.create({
        data: {
          userId: null,
          reportId: report.id,
          recipientEmail: agency.email,
          subject: letter.subject,
          message: `Gagal mengirim surat resmi ${letter.letterNumber || letter.subject} ke ${agency.name}.`,
          status: "failed",
          errorMessage,
        },
      });
    } catch (notificationError) {
      console.error("Failed to create failed notification:", notificationError);
    }

    return {
      status: "error",
      message: errorMessage,
    };
  }
}

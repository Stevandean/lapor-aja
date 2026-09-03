"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import type { ActionState } from "@/src/types/action";
import { sendOfficialLetterViaBrevo } from "@/src/lib/email/sendEmail";
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

  const supabase = await createClient();

  const { data: existingLetter, error: existingLetterError } = await supabase
    .from("official_letters")
    .select("id")
    .eq("report_id", reportId)
    .eq("letter_type", "surat_permohonan_perbaikan")
    .maybeSingle();

  if (existingLetterError) {
    return {
      status: "error",
      message: existingLetterError.message,
    };
  }

  if (existingLetter) {
    return {
      status: "error",
      message: "Surat resmi untuk laporan ini sudah ada.",
    };
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      status,
      agency_id,
      auto_address,
      manual_address,
      latitude,
      longitude
      `
    )
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
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

  if (!report.agency_id) {
    return {
      status: "error",
      message: "Instansi tujuan belum dipilih untuk laporan ini.",
    };
  }

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id, name, address")
    .eq("id", report.agency_id)
    .single();

  if (agencyError || !agency) {
    return {
      status: "error",
      message: "Instansi tujuan tidak ditemukan.",
    };
  }

  const letterNumber = generateOfficialLetterNumber(report.report_number);

  const subject = `Permohonan Perbaikan Tindak Lanjut Laporan ${report.report_number}`;

  const location =
    report.manual_address ||
    report.auto_address ||
    `Latitude ${report.latitude}, Longitude ${report.longitude}`;

  const body = [
    "Kepada Yth.",
    agency.name,
    agency.address ? `Alamat: ${agency.address}` : "",
    "",
    "Dengan hormat,",
    "",
    `Sehubungan dengan adanya laporan masyarakat melalui Sistem Lapor Aja dengan nomor laporan ${report.report_number}, Pemerintah Desa bermaksud menyampaikan permohonan tindak lanjut kepada ${agency.name}.`,
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

  const { error } = await supabase.from("official_letters").insert({
    report_id: report.id,
    letter_type: "surat_permohonan_perbaikan",
    letter_number: letterNumber,
    subject,
    body,
    recipient_agency_id: agency.id,
    generated_by: profile.id,
    generated_at: new Date().toISOString(),
    status: "draft",
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
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

  const supabase = await createClient();

  const { data: letter, error: letterError } = await supabase
    .from("official_letters")
    .select("id, status")
    .eq("id", letterId)
    .single();

  if (letterError || !letter) {
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

  const { error } = await supabase
    .from("official_letters")
    .update({
      status: "final",
      updated_at: new Date().toISOString(),
    })
    .eq("id", letterId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
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

  const supabase = await createClient();

  const { data: letter, error: letterError } = await supabase
    .from("official_letters")
    .select(
      `
      id,
      report_id,
      letter_number,
      subject,
      body,
      recipient_agency_id,
      status
      `
    )
    .eq("id", letterId)
    .single();

  if (letterError || !letter) {
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

  if (!letter.recipient_agency_id) {
    return {
      status: "error",
      message: "Instansi penerima tidak ditemukan.",
    };
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      manual_address,
      auto_address,
      latitude,
      longitude
      `
    )
    .eq("id", letter.report_id)
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      message: "Laporan terkait tidak ditemukan.",
    };
  }

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id, name, email, is_active")
    .eq("id", letter.recipient_agency_id)
    .single();

  if (agencyError || !agency) {
    return {
      status: "error",
      message: "Instansi penerima tidak ditemukan.",
    };
  }

  if (!agency.is_active) {
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
    report.manual_address ||
    report.auto_address ||
    `Latitude ${report.latitude}, Longitude ${report.longitude}`;

  try {
    await sendOfficialLetterViaBrevo({
      agencyEmail: agency.email,
      agencyName: agency.name,
      letterNumber: letter.letter_number,
      letterSubject: letter.subject,
      letterBody: letter.body,
      reportNumber: report.report_number,
      reportTitle: report.title,
      reportDescription: report.description,
      reportAddress: location,
    });

    const now = new Date().toISOString();

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: null,
        report_id: report.id,
        recipient_email: agency.email,
        subject: letter.subject,
        message: `Surat resmi ${letter.letter_number || letter.subject} sudah dikirim ke ${agency.name}.`,
        status: "sent",
        sent_at: now,
        error_message: null,
      });

    if (notificationError) {
      console.error("Failed to create sent notification:", notificationError);
    }

    const { error: updateLetterError } = await supabase
      .from("official_letters")
      .update({
        status: "sent",
        updated_at: now,
      })
      .eq("id", letter.id);

    if (updateLetterError) {
      return {
        status: "error",
        message: updateLetterError.message,
      };
    }

    const { error: updateReportError } = await supabase
      .from("reports")
      .update({
        status: "forwarded_to_agency",
        updated_at: now,
      })
      .eq("id", report.id);

    if (updateReportError) {
      return {
        status: "error",
        message: updateReportError.message,
      };
    }

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

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: null,
        report_id: report.id,
        recipient_email: agency.email,
        subject: letter.subject,
        message: `Gagal mengirim surat resmi ${letter.letter_number || letter.subject} ke ${agency.name}.`,
        status: "failed",
        sent_at: null,
        error_message: errorMessage,
      });

    if (notificationError) {
      console.error("Failed to create failed notification:", notificationError);
    }

    return {
      status: "error",
      message: errorMessage,
    };
  }
}

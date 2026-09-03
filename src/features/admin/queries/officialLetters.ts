import { createClient } from "@/src/lib/supabase/server";

export async function getOfficialLetterByReportId(reportId: string) {

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("official_letters")
    .select(
      `
      id,
      report_id,
      letter_type,
      letter_number,
      subject,
      body,
      recipient_agency_id,
      generated_by,
      generated_at,
      signed_by,
      signed_at,
      pdf_url,
      file_path,
      status,
      created_at,
      updated_at
      `
    )
    .eq("report_id", reportId)
    .eq("letter_type", "surat_permohonan_perbaikan")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch official letter:", error.message);
    return null;
  }

  return data;
}

export async function getReportsReadyForOfficialLetter() {

  const supabase = await createClient();

  const { data: existingLetters, error: letterError } = await supabase
    .from("official_letters")
    .select("report_id")
    .eq("letter_type", "surat_permohonan_perbaikan");

  if (letterError) {
    console.error("Failed to fetch existing letters:", letterError.message);
    return [];
  }

  const existingReportIds = new Set(
    (existingLetters ?? []).map((letter) => letter.report_id)
  );

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      report_number,
      title,
      description,
      status,
      agency_id,
      updated_at,
      agency:agencies!reports_agency_id_fkey(id, name)
      `
    )
    .eq("status", "forwarded_to_agency")
    .not("agency_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch reports ready for letters:", error.message);
    return [];
  }

  return (data ?? []).filter((report) => !existingReportIds.has(report.id));
}

export async function getGeneratedOfficialLetters() {

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("official_letters")
    .select(
      `
      id,
      report_id,
      letter_type,
      letter_number,
      subject,
      body,
      recipient_agency_id,
      generated_at,
      status,
      created_at,
      updated_at,
      report:reports!official_letters_report_id_fkey(
        id,
        report_number,
        title,
        status
      ),
      agency:agencies!official_letters_recipient_agency_id_fkey(
        id,
        name
      )
      `
    )
    .eq("letter_type", "surat_permohonan_perbaikan")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch generated official letters:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getOfficialLetterDetail(letterId: string) {

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("official_letters")
    .select(
      `
      id,
      report_id,
      letter_type,
      letter_number,
      subject,
      body,
      recipient_agency_id,
      generated_at,
      status,
      created_at,
      updated_at,
      report:reports!official_letters_report_id_fkey(
        id,
        report_number,
        title,
        description,
        status,
        manual_address,
        auto_address,
        latitude,
        longitude
      ),
      agency:agencies!official_letters_recipient_agency_id_fkey(
        id,
        name,
        address,
        contact_person,
        phone,
        email
      )
      `
    )
    .eq("id", letterId)
    .single();

  if (error) {
    console.error("Failed to fetch official letter detail:", error.message);
    return null;
  }

  return data;
}

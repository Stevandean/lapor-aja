export type EffectiveSlaStatus =
  | "on_time"
  | "at_risk"
  | "critical"
  | "overdue"
  | "completed"
  | "paused_budget"
  | "merged"
  | "not_set";

const SLA_COMPLETED_STATUSES = [
  "resolved",
  "archived",
  "rejected",
  "verified_invalid",
];

// Cabang 1a: 4 level Aman/Peringatan/Kritis/Terlambat berdasarkan persentase
// waktu terpakai dari total durasi SLA (created_at -> resolution_due_at).
// Threshold 60/85 (bukan 75/90) sengaja dipilih supaya "Peringatan" muncul
// lebih awal, memberi waktu bertindak sebelum masuk fase "Kritis" — lihat
// CLAUDE.md bagian Cabang 1 untuk rasionalisasi lengkap.
const AT_RISK_ELAPSED_THRESHOLD = 0.6;
const CRITICAL_ELAPSED_THRESHOLD = 0.85;

export type SlaReportSnapshot = {
  status: string;
  created_at: string;
  resolution_due_at: string | null;
  resolved_at: string | null;
};

export function calculateEffectiveSlaStatus(
  report: SlaReportSnapshot,
  now = new Date()
): EffectiveSlaStatus {
  if (report.status === "merged") {
    return "merged";
  }

  if (report.status === "waiting_budget") {
    return "paused_budget";
  }

  if (SLA_COMPLETED_STATUSES.includes(report.status) || report.resolved_at) {
    return "completed";
  }

  if (!report.resolution_due_at) {
    return "not_set";
  }

  const createdAt = new Date(report.created_at);
  const resolutionDueAt = new Date(report.resolution_due_at);

  if (
    Number.isNaN(createdAt.getTime()) ||
    Number.isNaN(resolutionDueAt.getTime())
  ) {
    return "not_set";
  }

  if (now > resolutionDueAt) {
    return "overdue";
  }

  const totalDuration = resolutionDueAt.getTime() - createdAt.getTime();

  if (totalDuration <= 0) {
    return "critical";
  }

  const elapsedFraction = (now.getTime() - createdAt.getTime()) / totalDuration;

  if (elapsedFraction >= CRITICAL_ELAPSED_THRESHOLD) {
    return "critical";
  }

  if (elapsedFraction >= AT_RISK_ELAPSED_THRESHOLD) {
    return "at_risk";
  }

  return "on_time";
}

export function isEffectiveSlaOverdue(report: SlaReportSnapshot) {
  return calculateEffectiveSlaStatus(report) === "overdue";
}

// =====================================================================
// Cabang 1c — tenggat SLA berbasis hari kerja
// =====================================================================
//
// KEPUTUSAN (2026-09-04): hari kerja SELALU aktif untuk SEMUA kalkulasi
// tenggat (verification_due_at DAN resolution_due_at) — tidak ada toggle
// untuk mematikannya per kategori atau global. Lihat CLAUDE.md bagian
// Cabang 1 untuk rasionalisasi lengkap.
//
// Semua perbandingan tanggal di bawah ini SENGAJA pakai komponen UTC
// (getUTCDay/toISOString), bukan waktu lokal server. Alasan: server bisa
// jalan di timezone apa pun (mesin dev WIB vs kemungkinan deploy production
// yang defaultnya UTC) — kalau perbandingan "apakah ini hari Sabtu/Minggu"
// dan "apakah tanggal ini hari libur" pakai basis yang berbeda-beda
// tergantung timezone proses, hasilnya bisa tidak konsisten. Basis UTC
// tunggal untuk keduanya membuat hasil deterministik di mana pun kode ini
// dijalankan.

const MS_PER_HOUR = 60 * 60 * 1000;

function isUtcWeekend(date: Date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function toUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isNonBusinessDay(date: Date, holidayDateKeys: ReadonlySet<string>) {
  return isUtcWeekend(date) || holidayDateKeys.has(toUtcDateKey(date));
}

/**
 * Hitung tenggat SLA dengan melompati jam yang jatuh di akhir pekan
 * (Sabtu/Minggu) atau tanggal di `holidayDateKeys` (format "YYYY-MM-DD",
 * lihat `toUtcDateKey`). Bergerak maju PER JAM dari `startDate`: tiap jam
 * yang jatuh di hari kerja mengurangi sisa `hours` yang perlu dipenuhi,
 * tiap jam yang jatuh di akhir pekan/libur dilewati begitu saja (kalender
 * tetap maju, tapi tidak mengurangi sisa jam SLA).
 *
 * Contoh pembuktian manual (sesuai yang diminta):
 * - Mulai Jumat 12:00 + 24 jam SLA, Sabtu-Minggu libur (tidak ada national
 *   holiday di rentang ini):
 *   - Jumat 12:00 -> Sabtu 00:00 = 12 jam kerja terhitung (sisa: 24-12=12)
 *   - Sabtu 00:00 -> Minggu 00:00 = 24 jam dilewati (bukan hari kerja)
 *   - Minggu 00:00 -> Senin 00:00 = 24 jam dilewati (bukan hari kerja)
 *   - Senin 00:00 + 12 jam sisa = Senin 12:00
 *   -> Hasil: Senin 12:00. Cocok dengan ekspektasi "Jumat siang + 24 jam
 *      SLA jatuh ke Senin siang".
 * - Mulai Senin 09:00 + 8 jam SLA, tidak ada akhir pekan/libur di antaranya
 *   -> Senin 17:00 (semua 8 jam adalah hari kerja, tidak ada yang
 *      dilompati, sama seperti kalkulasi mentah `now + jam`).
 * - Mulai Kamis 10:00 + 4 jam SLA, dengan Jumat sebagai national holiday:
 *   - Kamis 10:00 -> Kamis 14:00 = 4 jam kerja terhitung, sisa jam habis
 *     SEBELUM menyentuh hari Jumat yang libur
 *   -> Hasil: Kamis 14:00 (hari libur besok tidak berpengaruh sama sekali
 *      kalau tenggatnya sudah tercapai lebih dulu).
 */
export function calculateBusinessAwareDueDate(
  startDate: Date,
  hours: number,
  holidayDateKeys: ReadonlySet<string>
): Date {
  let remainingHours = hours;
  let current = new Date(startDate.getTime());

  while (remainingHours > 0) {
    current = new Date(current.getTime() + MS_PER_HOUR);

    if (!isNonBusinessDay(current, holidayDateKeys)) {
      remainingHours -= 1;
    }
  }

  return current;
}

// Dipindah dari village/actions.ts (dipakai apa adanya, logika tidak
// diubah) supaya bisa direuse oleh alur jeda anggaran (village/actions.ts)
// MAUPUN jeda swadaya (reports/swadayaActions.ts) — keduanya sama-sama
// menggeser tenggat maju sebesar durasi laporan "dijeda", cuma beda sumber
// timestamp pause/resume-nya (ReportBudgetRequest vs SwadayaCampaign).
export function extendDueDateByPauseWindow(
  dueAt: string | null,
  pausedAt: string,
  resumedAt: string
) {
  if (!dueAt) {
    return null;
  }

  const dueTime = new Date(dueAt).getTime();
  const pausedTime = new Date(pausedAt).getTime();
  const resumedTime = new Date(resumedAt).getTime();

  if (
    Number.isNaN(dueTime) ||
    Number.isNaN(pausedTime) ||
    Number.isNaN(resumedTime)
  ) {
    return dueAt;
  }

  const pauseDuration = Math.max(0, resumedTime - pausedTime);

  return new Date(dueTime + pauseDuration).toISOString();
}

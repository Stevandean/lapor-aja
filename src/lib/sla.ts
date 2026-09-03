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

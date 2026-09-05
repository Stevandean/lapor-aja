import { prisma } from "@/src/lib/prisma";

// Dipindah dari village/actions.ts (dipakai apa adanya, logika tidak
// diubah) supaya bisa direuse oleh alur pengajuan anggaran MAUPUN alur
// penutupan campaign swadaya — keduanya perlu tahu apakah Kasi sudah
// pernah mulai mengerjakan laporan (menentukan status lanjutan:
// `in_progress` vs `handled_by_village`).
export async function hasReportProgressUpdates(reportId: string) {
  const count = await prisma.reportProgressUpdate.count({
    where: { reportId },
  });

  return count > 0;
}

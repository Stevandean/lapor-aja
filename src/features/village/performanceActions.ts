"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";
import { getVillagePerformanceData } from "@/src/features/village/queries";
import {
  getPeriodRange,
  toDateOnlyUtc,
  type PerformancePeriodType,
} from "@/src/lib/performancePeriod";
import type { ActionState } from "@/src/types/action";

// Syarat minimum jumlah laporan supaya seksi dengan sedikit laporan tidak
// otomatis "menang" cuma karena kebetulan semuanya tepat waktu.
const MIN_REPORTS_THRESHOLD = 3;

// Skor komposit: 70% persen tepat waktu (metrik kepatuhan SLA utama) + 30%
// skor kecepatan relatif (rata-rata jam penyelesaian dinormalisasi antar
// seksi yang dibandingkan pada periode yang sama). Persen tepat waktu jadi
// bobot dominan karena itu ukuran kepatuhan SLA yang sebenarnya; kecepatan
// jadi pembeda kedua supaya seksi yang menyelesaikan jauh lebih cepat dari
// batas waktu (bukan cuma pas-pasan di bawah batas) tetap dihargai.
const ON_TIME_WEIGHT = 0.7;
const SPEED_WEIGHT = 0.3;

export async function generatePerformancePredicate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (!["kepala_desa", "sekdes"].includes(profile.role)) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  const periodTypeRaw = formData.get("periodType");
  const periodOffsetRaw = formData.get("periodOffset");

  const periodType: PerformancePeriodType =
    periodTypeRaw === "triwulanan" ? "triwulanan" : "bulanan";
  const periodOffset = Number(periodOffsetRaw ?? 1);

  if (!Number.isFinite(periodOffset) || periodOffset < 1) {
    return {
      status: "error",
      message:
        "Periode yang masih berjalan belum bisa dinilai. Pilih periode yang sudah selesai.",
    };
  }

  const data = await getVillagePerformanceData({ periodType, periodOffset });
  const qualifyingSections = data.bySection.filter(
    (section) => section.totalReports >= MIN_REPORTS_THRESHOLD
  );

  if (qualifyingSections.length === 0) {
    return {
      status: "error",
      message: `Belum ada seksi dengan minimal ${MIN_REPORTS_THRESHOLD} laporan selesai pada periode ini, predikat belum bisa ditentukan.`,
    };
  }

  const avgHoursList = qualifyingSections.map((section) => section.avgResolutionHours);
  const minAvgHours = Math.min(...avgHoursList);
  const maxAvgHours = Math.max(...avgHoursList);

  const scored = qualifyingSections.map((section) => {
    const speedScore =
      maxAvgHours > minAvgHours
        ? 100 * (1 - (section.avgResolutionHours - minAvgHours) / (maxAvgHours - minAvgHours))
        : 100;

    const compositeScore =
      ON_TIME_WEIGHT * section.onTimePercentage + SPEED_WEIGHT * speedScore;

    return { ...section, compositeScore };
  });

  const winner = scored.reduce((best, current) =>
    current.compositeScore > best.compositeScore ? current : best
  );

  const period = getPeriodRange(periodType, periodOffset);
  const badgeLabel = `Kinerja Terbaik ${period.label} — ${winner.name} (${Math.round(winner.onTimePercentage)}% tepat waktu, rata-rata ${winner.avgResolutionHours.toFixed(1)} jam)`;

  await prisma.performanceSnapshot.upsert({
    where: {
      periodType_periodStart_periodEnd_scopeType: {
        periodType,
        periodStart: toDateOnlyUtc(period.start),
        periodEnd: toDateOnlyUtc(period.end),
        scopeType: "seksi",
      },
    },
    update: {
      sectionId: winner.id,
      totalReports: winner.totalReports,
      onTimeReports: winner.onTimeReports,
      lateReports: winner.lateReports,
      onTimePercentage: winner.onTimePercentage,
      avgResolutionHours: winner.avgResolutionHours,
      badgeLabel,
    },
    create: {
      periodType,
      periodStart: toDateOnlyUtc(period.start),
      periodEnd: toDateOnlyUtc(period.end),
      scopeType: "seksi",
      sectionId: winner.id,
      totalReports: winner.totalReports,
      onTimeReports: winner.onTimeReports,
      lateReports: winner.lateReports,
      onTimePercentage: winner.onTimePercentage,
      avgResolutionHours: winner.avgResolutionHours,
      badgeLabel,
    },
  });

  revalidatePath("/dashboard/village/performance");

  return {
    status: "success",
    message: `Predikat ${period.label} ditentukan: ${winner.name}.`,
  };
}

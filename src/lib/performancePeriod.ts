// Perhitungan rentang periode (bulanan/triwulanan) untuk Cabang 3 —
// Evaluasi Kinerja. Murni fungsi tanggal, tidak menyentuh database, supaya
// mudah dipakai ulang baik oleh query live (3a/3b) maupun action predikat
// (3c) dan gampang diverifikasi manual.
//
// offset = 0 berarti periode saat ini (bulan/triwulan yang sedang berjalan,
// biasanya belum genap sebulan sehingga datanya tipis) — offset 1 berarti
// satu periode sebelumnya (periode penuh terakhir), dst semakin besar
// semakin ke masa lalu.

export type PerformancePeriodType = "bulanan" | "triwulanan";

export type PeriodRange = {
  offset: number;
  start: Date;
  end: Date;
  label: string;
};

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

export function getPeriodRange(
  periodType: PerformancePeriodType,
  offset: number,
  referenceDate: Date = new Date()
): PeriodRange {
  if (periodType === "bulanan") {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth() - offset;
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return {
      offset,
      start,
      end,
      label: MONTH_LABEL_FORMATTER.format(start),
    };
  }

  const currentQuarterIndex =
    referenceDate.getFullYear() * 4 + Math.floor(referenceDate.getMonth() / 3);
  const targetQuarterIndex = currentQuarterIndex - offset;
  const year = Math.floor(targetQuarterIndex / 4);
  const quarter = ((targetQuarterIndex % 4) + 4) % 4;
  const startMonth = quarter * 3;
  const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);

  return {
    offset,
    start,
    end,
    label: `Triwulan ${quarter + 1} ${year}`,
  };
}

// Jendela periode berurutan (lama -> baru) yang berakhir di `endOffset`,
// dipakai untuk chart tren periode-ke-periode.
export function getPeriodWindow(
  periodType: PerformancePeriodType,
  length: number,
  endOffset: number,
  referenceDate: Date = new Date()
): PeriodRange[] {
  const periods: PeriodRange[] = [];

  for (let i = length - 1; i >= 0; i -= 1) {
    periods.push(getPeriodRange(periodType, endOffset + i, referenceDate));
  }

  return periods;
}

// Daftar pilihan periode untuk dropdown filter, terbaru dulu.
export function getPeriodOptions(
  periodType: PerformancePeriodType,
  count: number,
  referenceDate: Date = new Date()
): PeriodRange[] {
  const options: PeriodRange[] = [];

  for (let offset = 0; offset < count; offset += 1) {
    options.push(getPeriodRange(periodType, offset, referenceDate));
  }

  return options;
}

export const PERFORMANCE_TREND_LENGTH: Record<PerformancePeriodType, number> = {
  bulanan: 6,
  triwulanan: 4,
};

export const PERFORMANCE_PERIOD_OPTION_COUNT: Record<PerformancePeriodType, number> = {
  bulanan: 8,
  triwulanan: 6,
};

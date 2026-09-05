// Cabang 4b: bangun HTML untuk dirender jadi PDF lewat Playwright
// (page.setContent + page.pdf()). Gaya inline murni (bukan Tailwind) —
// halaman PDF dirender lepas dari pipeline CSS aplikasi, jadi semua style
// harus ditulis eksplisit di sini, mengikuti pola `buildSlaEmailHtml` di
// slaAlertNotifications.ts untuk HTML email.

type PerformanceSummary = {
  totalReports: number;
  onTimeReports: number;
  lateReports: number;
  onTimePercentage: number;
  avgResolutionHours: number;
};

type PerformanceGroupSummary = {
  id: string;
  name: string;
} & PerformanceSummary;

export function buildPerformancePdfHtml({
  periodLabel,
  includeDemo,
  summary,
  bySection,
  byCategory,
  generatedAt,
}: {
  periodLabel: string;
  includeDemo: boolean;
  summary: PerformanceSummary;
  bySection: PerformanceGroupSummary[];
  byCategory: PerformanceGroupSummary[];
  generatedAt: string;
}) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            color: #111827;
            padding: 32px;
            font-size: 13px;
          }
          h1 { font-size: 20px; margin: 0 0 4px; }
          h2 { font-size: 15px; margin: 24px 0 8px; }
          p.subtitle { margin: 0 0 20px; color: #4b5563; }
          .stats { display: flex; gap: 12px; margin-bottom: 8px; }
          .stat-box {
            flex: 1;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
          }
          .stat-box .label { color: #6b7280; font-size: 11px; }
          .stat-box .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 6px 10px;
            text-align: left;
            font-size: 12px;
          }
          th { background: #f9fafb; font-weight: 700; }
          .banner {
            margin-top: 20px;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 11px;
            background: ${includeDemo ? "#fef3c7" : "#f3f4f6"};
            color: ${includeDemo ? "#92400e" : "#4b5563"};
          }
          .footer { margin-top: 24px; color: #9ca3af; font-size: 10px; }
        </style>
      </head>
      <body>
        <h1>Evaluasi Kinerja Penanganan Laporan</h1>
        <p class="subtitle">Periode: ${escapeHtml(periodLabel)}</p>

        <div class="stats">
          <div class="stat-box">
            <div class="label">Laporan Selesai</div>
            <div class="value">${summary.totalReports}</div>
          </div>
          <div class="stat-box">
            <div class="label">Tepat Waktu</div>
            <div class="value">${summary.onTimeReports} (${Math.round(summary.onTimePercentage)}%)</div>
          </div>
          <div class="stat-box">
            <div class="label">Terlambat</div>
            <div class="value">${summary.lateReports}</div>
          </div>
          <div class="stat-box">
            <div class="label">Rata-rata Penyelesaian</div>
            <div class="value">${summary.avgResolutionHours.toFixed(1)} jam</div>
          </div>
        </div>

        <h2>Performa per Seksi</h2>
        ${buildGroupTable(bySection)}

        <h2>Performa per Kategori</h2>
        ${buildGroupTable(byCategory)}

        <div class="banner">
          ${
            includeDemo
              ? "Angka di atas TERMASUK data contoh (demo) yang dipakai untuk keperluan pengujian/demonstrasi sistem."
              : "Angka di atas TIDAK termasuk data contoh (demo) — murni laporan sungguhan."
          }
        </div>

        <p class="footer">Dibuat otomatis oleh sistem Lapor Aja pada ${escapeHtml(generatedAt)}.</p>
      </body>
    </html>
  `;
}

function buildGroupTable(groups: PerformanceGroupSummary[]) {
  if (groups.length === 0) {
    return `<p style="color:#6b7280;">Belum ada data laporan selesai pada periode ini.</p>`;
  }

  const rows = groups
    .map(
      (group) => `
        <tr>
          <td>${escapeHtml(group.name)}</td>
          <td>${group.totalReports}</td>
          <td>${group.onTimeReports}</td>
          <td>${group.lateReports}</td>
          <td>${Math.round(group.onTimePercentage)}%</td>
          <td>${group.avgResolutionHours.toFixed(1)} jam</td>
        </tr>
      `
    )
    .join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Nama</th>
          <th>Total</th>
          <th>Tepat Waktu</th>
          <th>Terlambat</th>
          <th>% Tepat Waktu</th>
          <th>Rata-rata Jam</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

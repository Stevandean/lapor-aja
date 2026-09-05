import { chromium } from "playwright";

// Cabang 4b: infrastruktur render HTML->PDF via Playwright (Chromium yang
// sama dipakai untuk E2E testing, dipindah ke `dependencies` supaya bisa
// dipakai saat runtime — lihat CLAUDE.md untuk rasionalisasi lengkap dan
// risiko deploy-nya). Diekstrak jadi helper bersama di sini supaya rute
// ekspor evaluasi kinerja (Cabang 4b) dan generate PDF surat resmi
// (Cabang "beres-beres") reuse mekanisme yang SAMA persis, bukan
// duplikat logika buka/tutup browser.
export async function renderHtmlToPdf(
  html: string,
  options?: {
    margin?: { top?: string; bottom?: string; left?: string; right?: string };
  }
): Promise<Buffer> {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: options?.margin ?? {
        top: "16mm",
        bottom: "16mm",
        left: "14mm",
        right: "14mm",
      },
    });
  } finally {
    await browser.close();
  }
}

import fs from "node:fs/promises";
import path from "node:path";
import { renderHtmlToPdf } from "@/src/lib/pdf";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads", "letters");

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

// HTML mengikuti tata letak kop-surat yang sama persis dengan halaman
// pratinjau (`admin/letters/[letterId]/page.tsx`) supaya PDF yang
// diunduh terlihat identik dengan yang dilihat admin di layar sebelum
// diunduh.
function buildOfficialLetterPdfHtml({
  letterNumber,
  subject,
  body,
  generatedAt,
}: {
  letterNumber: string | null;
  subject: string;
  body: string;
  generatedAt: Date;
}) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: "Times New Roman", Georgia, serif;
            color: #0f172a;
            padding: 24px;
            font-size: 13px;
            line-height: 1.7;
          }
          header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 16px;
            text-align: center;
          }
          header .title {
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          header .subtitle { margin-top: 4px; font-size: 12px; }
          header .description { margin-top: 4px; font-size: 11px; color: #475569; }
          table.meta { margin-top: 28px; font-size: 13px; }
          table.meta td { padding: 2px 0; vertical-align: top; }
          table.meta td.label { width: 100px; }
          section.body {
            margin-top: 28px;
            white-space: pre-wrap;
            font-size: 13px;
          }
          section.signature {
            margin-top: 48px;
            display: flex;
            justify-content: flex-end;
          }
          section.signature .block {
            width: 260px;
            text-align: center;
            font-size: 13px;
          }
          section.signature .spacer { height: 96px; }
          section.signature .title-line {
            font-weight: 700;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <header>
          <p class="title">Pemerintah Desa</p>
          <p class="subtitle">Sistem Lapor Aja - Sistem Pelaporan Desa</p>
          <p class="description">Surat Permohonan Tindak Lanjut Laporan Masyarakat</p>
        </header>

        <table class="meta">
          <tr>
            <td class="label">Nomor</td>
            <td>: ${escapeHtml(letterNumber ?? "-")}</td>
          </tr>
          <tr>
            <td class="label">Perihal</td>
            <td>: ${escapeHtml(subject)}</td>
          </tr>
        </table>

        <section class="body">${escapeHtml(body)}</section>

        <section class="signature">
          <div class="block">
            <p>${escapeHtml(formatDate(generatedAt))}</p>
            <p>Pemerintah Desa</p>
            <div class="spacer"></div>
            <p class="title-line">Kepala Desa</p>
          </div>
        </section>
      </body>
    </html>
  `;
}

// Generate PDF dari isi surat lalu simpan ke disk, mengikuti pola yang
// sama seperti 5 lokasi upload lain di proyek ini
// (`public/uploads/<kategori>/<id>/<uuid>.<ext>`). Mengembalikan path
// publik (mis. `/uploads/letters/<letterId>/<uuid>.pdf`) untuk diisi ke
// KEDUA kolom `pdf_url` dan `file_path` (konvensi yang sama dipakai
// `ReportPhoto.filePath`/`photoUrl` — dua kolom, satu nilai).
export async function generateOfficialLetterPdf({
  letterId,
  letterNumber,
  subject,
  body,
}: {
  letterId: string;
  letterNumber: string | null;
  subject: string;
  body: string;
}): Promise<string> {
  const html = buildOfficialLetterPdfHtml({
    letterNumber,
    subject,
    body,
    generatedAt: new Date(),
  });

  const pdfBuffer = await renderHtmlToPdf(html);

  const dir = path.join(UPLOADS_ROOT, letterId);
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${crypto.randomUUID()}.pdf`;
  const filePath = `/uploads/letters/${letterId}/${fileName}`;

  await fs.writeFile(path.join(dir, fileName), pdfBuffer);

  return filePath;
}

// Seed data historis dummy untuk demo Cabang 3 (Evaluasi Kinerja).
// Jalankan manual, SEKALI: node prisma/seedPerformanceDemoData.mjs
//
// Data ini SENGAJA dibiarkan tersimpan (tidak dihapus otomatis oleh skrip
// mana pun) — dipakai untuk demo dashboard evaluasi kinerja & predikat.
// Semua akun pelapor & Kasi demo diberi nama berawalan "Demo -" supaya
// gampang dibedakan dari data asli. Master data (kategori/dusun/seksi/
// aturan SLA) dibuat dengan nama realistis (BUKAN diberi label "Demo") —
// itu memang jadi data referensi sungguhan yang dibutuhkan aplikasi
// berjalan normal, bukan sesuatu yang perlu dihapus nanti.
//
// Password akun demo (Kasi/pelapor) kalau perlu login manual saat demo:
// "Demo12345!"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Demo12345!";

const CATEGORY_NAMES = [
  "Kerusakan Jalan",
  "Penerangan Jalan Umum",
  "Sampah dan Kebersihan",
  "Saluran Air dan Drainase",
  "Fasilitas Umum",
];

const DUSUN_NAMES = ["Dusun Krajan", "Dusun Sumberejo", "Dusun Wonorejo", "Dusun Tegalsari"];

// Section performance bias: dipakai supaya hasil predikat (Tugas 5) benar-benar
// bisa dibuktikan bukan kebetulan — satu seksi sengaja dibuat jauh lebih baik.
const SECTIONS = [
  { name: "Seksi Pembangunan", onTimeBias: 0.82 },
  { name: "Seksi Pelayanan Umum", onTimeBias: 0.55 },
  { name: "Seksi Kesejahteraan Rakyat", onTimeBias: 0.6 },
];

const TITLE_TEMPLATES = {
  "Kerusakan Jalan": [
    "Jalan berlubang di {dusun}",
    "Aspal rusak parah di {dusun}",
    "Jalan retak dan bergelombang di {dusun}",
  ],
  "Penerangan Jalan Umum": [
    "Lampu jalan mati di {dusun}",
    "PJU tidak menyala sudah beberapa hari di {dusun}",
  ],
  "Sampah dan Kebersihan": [
    "Sampah menumpuk di {dusun}",
    "Tidak ada tempat sampah di area {dusun}",
  ],
  "Saluran Air dan Drainase": [
    "Saluran air tersumbat di {dusun}",
    "Got mampet menyebabkan genangan di {dusun}",
  ],
  "Fasilitas Umum": [
    "Pos ronda rusak di {dusun}",
    "Balai pertemuan warga perlu perbaikan di {dusun}",
  ],
};

const PRIORITIES = ["rendah", "sedang", "sedang", "tinggi", "darurat"]; // weighted
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateReportNumber(date) {
  const year = date.getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `LPR-${year}-${random}`;
}

async function main() {
  const existing = await prisma.category.findFirst({
    where: { name: CATEGORY_NAMES[0] },
  });

  if (existing) {
    console.log(
      "Master data seed (kategori) sudah ada — skrip ini kelihatannya sudah pernah dijalankan. Berhenti supaya tidak duplikat."
    );
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Master data ---
  const categories = [];
  for (const name of CATEGORY_NAMES) {
    categories.push(await prisma.category.create({ data: { name, isActive: true } }));
  }

  const dusuns = [];
  for (const name of DUSUN_NAMES) {
    dusuns.push(await prisma.dusun.create({ data: { name, isActive: true } }));
  }

  const sections = [];
  for (const s of SECTIONS) {
    const section = await prisma.villageSection.create({
      data: { name: s.name, isActive: true },
    });
    sections.push({ ...section, onTimeBias: s.onTimeBias });
  }

  const slaRulesData = [
    { priority: "rendah", verificationHours: 48, resolutionHours: 240 },
    { priority: "sedang", verificationHours: 24, resolutionHours: 120 },
    { priority: "tinggi", verificationHours: 12, resolutionHours: 72 },
    { priority: "darurat", verificationHours: 4, resolutionHours: 24 },
  ];
  for (const rule of slaRulesData) {
    await prisma.slaRule.upsert({
      where: { priority: rule.priority },
      update: {},
      create: { ...rule, isActive: true },
    });
  }

  // --- Kasi demo per section ---
  const kasiBySection = new Map();
  for (const [index, section] of sections.entries()) {
    const kasi = await prisma.profile.create({
      data: {
        fullName: `Demo - Kasi ${section.name}`,
        email: `demo.kasi.${index + 1}@lapor-aja.test`,
        passwordHash,
        role: "kasi",
        sectionId: section.id,
        isActive: true,
      },
    });
    kasiBySection.set(section.id, kasi);
  }

  // --- Demo reporter pool ---
  const reporters = [];
  for (let i = 1; i <= 6; i += 1) {
    reporters.push(
      await prisma.profile.create({
        data: {
          fullName: `Demo - Warga ${i}`,
          email: `demo.warga.${i}@lapor-aja.test`,
          passwordHash,
          role: "public",
          isActive: true,
        },
      })
    );
  }

  // --- Historical reports, 4 months back ---
  const now = new Date();
  const months = [];
  for (let m = 4; m >= 1; m -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59);
    months.push({ start: monthStart, end: monthEnd });
  }

  let totalCreated = 0;

  for (const month of months) {
    const reportCount = randomInt(15, 25);

    for (let i = 0; i < reportCount; i += 1) {
      const category = randomItem(categories);
      const dusun = randomItem(dusuns);
      const section = randomItem(sections);
      const reporter = randomItem(reporters);
      const priority = randomItem(PRIORITIES);
      const slaRule = slaRulesData.find((r) => r.priority === priority);

      const createdAt = new Date(
        month.start.getTime() +
          Math.random() * (month.end.getTime() - month.start.getTime())
      );
      const verificationDueAt = new Date(
        createdAt.getTime() + slaRule.verificationHours * HOUR
      );
      const resolutionDueAt = new Date(
        createdAt.getTime() + slaRule.resolutionHours * HOUR
      );

      // ~15% of reports are still unresolved (weighted toward more recent months).
      const isRecentMonth = month.end.getTime() > now.getTime() - 35 * DAY;
      const unresolvedChance = isRecentMonth ? 0.3 : 0.05;
      const staysUnresolved = Math.random() < unresolvedChance;

      let status;
      let resolvedAt = null;
      let assignedSectionId = null;

      if (staysUnresolved) {
        status = randomItem(["need_verification", "verified_valid", "handled_by_village", "in_progress"]);
        if (["handled_by_village", "in_progress"].includes(status)) {
          assignedSectionId = section.id;
        }
      } else {
        status = "resolved";
        assignedSectionId = section.id;

        const onTime = Math.random() < section.onTimeBias;
        if (onTime) {
          // Finish sometime between 20% and 95% of the way through the window.
          const fraction = 0.2 + Math.random() * 0.75;
          resolvedAt = new Date(
            createdAt.getTime() +
              fraction * (resolutionDueAt.getTime() - createdAt.getTime())
          );
        } else {
          // Finish 1-72h after the deadline.
          resolvedAt = new Date(resolutionDueAt.getTime() + randomInt(1, 72) * HOUR);
        }
      }

      const titleTemplate = randomItem(TITLE_TEMPLATES[category.name]);
      const title = titleTemplate.replace("{dusun}", dusun.name);

      const baseLat = -7.9 + (Math.random() - 0.5) * 0.05;
      const baseLng = 112.5 + (Math.random() - 0.5) * 0.05;

      await prisma.report.create({
        data: {
          reportNumber: generateReportNumber(createdAt),
          reporterId: reporter.id,
          title,
          description: `${title}. Mohon segera ditindaklanjuti oleh pihak desa.`,
          categoryId: category.id,
          dusunId: dusun.id,
          latitude: baseLat.toFixed(6),
          longitude: baseLng.toFixed(6),
          status,
          priority,
          assetStatus: "bukan_aset_desa",
          authorityLevel: "desa",
          followUpType: status === "resolved" || assignedSectionId ? "ditangani_desa" : "belum_ditentukan",
          assignedSectionId,
          verificationDueAt,
          resolutionDueAt,
          resolvedAt,
          slaStatus: resolvedAt ? "completed" : "on_time",
          createdAt,
          updatedAt: resolvedAt ?? createdAt,
        },
      });

      totalCreated += 1;
    }
  }

  console.log(`Selesai. ${totalCreated} laporan demo dibuat di ${months.length} bulan terakhir.`);
  console.log(`Kategori: ${categories.length}, Dusun: ${dusuns.length}, Seksi: ${sections.length}`);
  console.log(`Kasi demo: ${kasiBySection.size}, Pelapor demo: ${reporters.length}`);
  console.log(`Password akun demo: ${DEMO_PASSWORD}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

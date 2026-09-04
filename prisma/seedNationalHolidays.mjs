// Seed hari libur nasional Indonesia untuk kalkulasi tenggat SLA berbasis
// hari kerja (Cabang 1c). Jalankan manual: node prisma/seedNationalHolidays.mjs
//
// 2026 — SUMBER RESMI: SKB 3 Menteri, ditetapkan 19 September 2025
// (setneg.go.id/baca/index/inilah_skb_3_menteri_libur_nasional_dan_cuti_bersama_2026).
// 2027 — PERKIRAAN, BUKAN RESMI: SKB 3 Menteri untuk 2027 belum terbit saat
// data ini disusun. Tanggal hari raya yang mengikuti kalender lunar
// (Islam/Imlek/Nyepi/Waisak) dan kalender Kristiani (Paskah) dihitung
// mengikuti pola pergeseran tahun-tahun sebelumnya, BUKAN dari pengumuman
// resmi pemerintah. Update baris ini begitu SKB 2027 resmi terbit.
const holidays = [
  // ===== 2026 (RESMI) =====
  { date: "2026-01-01", description: "Tahun Baru Masehi" },
  { date: "2026-01-16", description: "Isra Mikraj Nabi Muhammad SAW" },
  { date: "2026-02-17", description: "Tahun Baru Imlek 2577 Kongzili" },
  { date: "2026-03-19", description: "Hari Suci Nyepi (Tahun Baru Saka 1948)" },
  { date: "2026-03-21", description: "Hari Raya Idul Fitri 1447 H (hari ke-1)" },
  { date: "2026-03-22", description: "Hari Raya Idul Fitri 1447 H (hari ke-2)" },
  { date: "2026-04-03", description: "Wafat Isa Al Masih" },
  { date: "2026-04-05", description: "Kebangkitan Isa Al Masih (Paskah)" },
  { date: "2026-05-01", description: "Hari Buruh Internasional" },
  { date: "2026-05-14", description: "Kenaikan Isa Al Masih" },
  { date: "2026-05-27", description: "Hari Raya Idul Adha 1447 H" },
  { date: "2026-05-31", description: "Hari Raya Waisak 2570 BE" },
  { date: "2026-06-01", description: "Hari Lahir Pancasila" },
  { date: "2026-06-16", description: "Tahun Baru Islam 1448 H (1 Muharam)" },
  { date: "2026-08-17", description: "Hari Kemerdekaan Republik Indonesia" },
  { date: "2026-08-25", description: "Maulid Nabi Muhammad SAW" },
  { date: "2026-12-25", description: "Hari Raya Natal" },

  // ===== 2027 (PERKIRAAN — lihat catatan di atas) =====
  { date: "2027-01-01", description: "Tahun Baru Masehi" },
  { date: "2027-01-05", description: "Isra Mikraj Nabi Muhammad SAW (perkiraan)" },
  { date: "2027-02-06", description: "Tahun Baru Imlek 2578 Kongzili (perkiraan)" },
  { date: "2027-03-09", description: "Hari Suci Nyepi (Tahun Baru Saka 1949) (perkiraan)" },
  { date: "2027-03-10", description: "Hari Raya Idul Fitri 1448 H (hari ke-1, perkiraan)" },
  { date: "2027-03-11", description: "Hari Raya Idul Fitri 1448 H (hari ke-2, perkiraan)" },
  { date: "2027-03-26", description: "Wafat Isa Al Masih (perkiraan)" },
  { date: "2027-03-28", description: "Kebangkitan Isa Al Masih (Paskah) (perkiraan)" },
  { date: "2027-05-01", description: "Hari Buruh Internasional" },
  { date: "2027-05-06", description: "Kenaikan Isa Al Masih (perkiraan)" },
  { date: "2027-05-16", description: "Hari Raya Idul Adha 1448 H (perkiraan)" },
  { date: "2027-05-20", description: "Hari Raya Waisak 2571 BE (perkiraan)" },
  { date: "2027-06-01", description: "Hari Lahir Pancasila" },
  { date: "2027-06-06", description: "Tahun Baru Islam 1449 H (1 Muharam) (perkiraan)" },
  { date: "2027-08-15", description: "Maulid Nabi Muhammad SAW (perkiraan)" },
  { date: "2027-08-17", description: "Hari Kemerdekaan Republik Indonesia" },
  { date: "2027-12-25", description: "Hari Raya Natal" },
];

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

const result = await prisma.nationalHoliday.createMany({
  data: holidays.map((holiday) => ({
    date: new Date(`${holiday.date}T00:00:00.000Z`),
    description: holiday.description,
  })),
  skipDuplicates: true,
});

console.log(`Inserted ${result.count} of ${holidays.length} holiday rows (duplicates skipped).`);

await prisma.$disconnect();

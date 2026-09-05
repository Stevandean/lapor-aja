# Lapor Aja — Konteks Proyek Tugas Akhir

Dokumen ini adalah konteks persisten untuk Claude Code. Baca seluruh isinya
sebelum mengerjakan tugas apapun di project ini.

## Tentang Proyek

**Lapor Aja** adalah website pengaduan dan penanganan pengaduan publik desa,
awalnya dibangun sebagai proyek magang (PKL) mahasiswa Sistem Informasi,
sekarang dilanjutkan sebagai **Tugas Akhir jalur Teknologi Tepat Guna**.

**Judul TA (sudah di-ACC dosen, tidak bisa diganti):**
"Sistem Peringatan Dini dan Evaluasi Kinerja Pengaduan Berbasis Service Level
Agreement pada Website Lapor Aja"

**Studi kasus:** Desa Kucur (mengacu ke dokumen RPJMDes Perubahan Desa Kucur
2019–2025 sebagai landasan latar belakang & rumusan masalah).

**Gap akademis yang dijawab** (dari 3 sumber: penelitian terdahulu, dokumen
legal, web pembanding):
- Perpres No. 76/2013 Pasal 12 (batas waktu 60 hari) & Pasal 9-10 (wajib
  pemantauan/evaluasi berkala) & Pasal 17 (wajib penilaian kinerja) — Lapor
  Aja mencatat SLA tapi pasif, belum ada deteksi otomatis.
- SP4N-LAPOR! (nasional) sudah terapkan SLA bertahap (3-5-10 hari kerja)
  sebagai standar operasional — bukan aturan Perpres, jangan diklaim begitu.
- Penelitian sejenis level desa (2022-2025) rata-rata cuma sampai fitur dasar
  (daftar, ajukan, tanggapi, pantau status) — belum ada yang bahas deteksi
  keterlambatan otomatis atau evaluasi kinerja berbasis waktu.

## Arah Pengembangan TA: 5 Cabang Fitur

Semua fitur berikut **WAJIB** dikerjakan (bukan opsional), didesain rule-based
(bukan machine learning) sesuai prinsip teknologi tepat guna.

### Cabang 1 — Deteksi & Klasifikasi Waktu — **SELESAI TOTAL (2026-09-04)**
- [x] **1a. SELESAI (2026-09-03)** — Klasifikasi status waktu otomatis 4
  level **Aman (on_time) → Peringatan (at_risk) → Kritis (critical) →
  Terlambat (overdue)**. Detail implementasi & rasionalisasi threshold ada
  di "Progres Sejauh Ini" bagian "FASE FITUR BARU" di bawah.
- [x] **1b. SELESAI (2026-09-04)** — Ambang batas SLA per kategori laporan,
  opsional, menggantikan mutlak aturan priority kalau ada. Detail di
  "Progres Sejauh Ini".
- [x] **1c. SELESAI (2026-09-04)** — Perhitungan tenggat SLA berbasis hari
  kerja (melompati Sabtu/Minggu + hari libur nasional), berlaku global
  untuk semua laporan (bukan opsional per kategori). Detail di "Progres
  Sejauh Ini".

### Cabang 2 — Notifikasi & Eskalasi — **SELESAI (2026-09-04)**
- [x] **2a. SELESAI** — Notifikasi bertingkat sesuai level eskalasi: level 1
  → Kasi penanggung jawab (fallback ke Admin kalau laporan belum
  diklasifikasi), level 2 → +Admin, level 3 → +Kepala Desa/Sekdes. Detail
  di "Progres Sejauh Ini".
- [x] **2b. SELESAI** — Daftar laporan berisiko (watchlist): 3 halaman
  kerja harian yang SUDAH ADA (`/dashboard/kasi/reports`,
  `/dashboard/admin/reports`, `/dashboard/village/sla`) diperluas dengan
  badge status SLA + filter, **BUKAN halaman baru** — lihat rasionalisasi
  di "Progres Sejauh Ini".

### Cabang 3 — Evaluasi Kinerja — **SELESAI (2026-09-04)**
- [x] **3a. SELESAI** — Dashboard evaluasi kinerja per periode (bulanan/
  triwulanan): total selesai, jumlah+persen tepat waktu vs terlambat,
  rata-rata jam penyelesaian, chart tren antar periode. Live query dari
  `Report`, TIDAK pakai `PerformanceSnapshot`. Detail di "Progres Sejauh
  Ini".
- [x] **3b. SELESAI** — Breakdown yang sama dipecah **per seksi dan per
  kategori** (bukan per dusun seperti disebut di draf awal cabang ini —
  ini keputusan eksplisit pengguna saat memberi instruksi tugas sesi ini,
  konsisten dengan keputusan 3c yang juga per seksi, bukan penyimpangan
  tanpa arahan).
- [x] **3c. SELESAI** — Predikat kinerja terbaik **per seksi** (BUKAN per
  Kasi individu — lihat rasionalisasi penting di "Progres Sejauh Ini"),
  syarat minimum 3 laporan, skor komposit 70% tepat waktu + 30% kecepatan,
  disimpan sebagai `PerformanceSnapshot`, di-generate manual lewat tombol.

### Cabang 4 — Transparansi & Akuntabilitas — **SELESAI (2026-09-05)**
- [x] **4a. SELESAI** — Audit trail `report_status_logs`/`report_sla_events`
  sudah ada sejak Cabang 1-3, TAPI investigasi menemukan 2 aksi baru yang
  belum tercatat sama sekali (alert SLA terkirim, predikat kinerja
  di-generate) — sekarang keduanya tercatat. Detail di "Progres Sejauh
  Ini".
- [x] **4b. SELESAI** — Ekspor evaluasi kinerja PDF (ringkasan periode,
  render HTML→PDF via Playwright) dan Excel (`.xlsx` asli via `exceljs`,
  detail per laporan), dengan toggle "sertakan data contoh" (default OFF).
  Detail di "Progres Sejauh Ini".
- [x] **4c. SELESAI** — Halaman publik `/statistik-sla`, ANONIM SUNGGUHAN
  (tanpa login sama sekali), statistik agregat saja, SELALU mengecualikan
  data demo. Detail di "Progres Sejauh Ini".

### Cabang 5 — Percepatan Penyelesaian via Swadaya Masyarakat — **SELESAI
(2026-09-05) — SELURUH 5 CABANG TA SUDAH SELESAI**
- [x] **5a. SELESAI** — Buka galang swadaya **MANUAL lewat tombol** (BUKAN
  otomatis/cron seperti draf awal cabang ini — lihat KEPUTUSAN 4 di
  "Progres Sejauh Ini" untuk alasannya), tersedia untuk laporan yang sudah
  ditugaskan ke seksi dan belum `resolved`. Reuse status `waiting_budget`
  yang sudah ada untuk menjeda SLA (BUKAN status/enum baru) — lihat
  KEPUTUSAN 1.
- [x] **5b. SELESAI** — Kontribusi multi-jenis: **uang, material, logistik,
  tenaga**, WAJIB login (semua role, tidak dibatasi cuma warga) — lihat
  KEPUTUSAN 2. Catatan akademis: penelitian Kurniasih & Mulyono (2022)
  sudah singgung donasi/galang dana secara umum, jadi kebaruan kita
  ditekankan di multi-jenis kontribusinya, bukan konsep donasi itu sendiri.
- [x] **5c. SELESAI** — Progres transparan per laporan: total terkumpul
  (uang, hanya yang terverifikasi) vs target, daftar kontribusi non-tunai,
  terlihat oleh SEMUA role yang bisa buka detail laporan itu (termasuk
  Kasi, read-only).
- [x] **5d. SELESAI** — Verifikasi (`pending→verified`) dan konfirmasi
  terima (`verified→received`, dengan foto bukti opsional) sebagai 2 tahap
  TERPISAH, khusus Admin/Kepala Desa/Sekdes. Tutup campaign memicu resume
  SLA.

## Tech Stack

- Next.js 16.2.9 (App Router), React 19.2.4, TypeScript, Tailwind 4
- Auth: **NextAuth.js v5 beta** (Credentials + JWT) — SUDAH di-swap dari
  Supabase Auth (2026-09-02), lihat "Progres Sejauh Ini" untuk detail
- Database: **MySQL + Prisma** (SUDAH di-migrate dari Supabase Postgres)
- Supabase MASIH dipakai untuk: Postgres/`.from()` query di sebagian besar
  `queries.ts`/`actions.ts` (belum di-swap, itu fase berikutnya), Storage
  (foto via signed URL, rencana pindah ke `public/uploads` lokal)
- Leaflet/react-leaflet (peta), Recharts (dashboard), Brevo (email API),
  WhatsVA (gateway WhatsApp pihak ketiga)
- Struktur feature-based: `src/features/{admin,auth,citizen,dashboard,
  hamlet-head,kasi,letters,maps,master-data,notifications,reports,settings,
  verification,village}`, masing-masing punya `actions.ts`/`actions/`
  (Server Actions), `queries.ts`/`queries/`, `components/`
- Tidak ada Next.js middleware — role-check per halaman/action via
  `requireRole()`/`requireAuth()` di `src/lib/auth/`

## Keputusan Arsitektur yang Sudah Diambil

1. **Migrasi database wajib: Supabase (Postgres) → MySQL + Prisma.**
   Diwajibkan dosen pembimbing, bukan opsional.
2. **Urutan pengerjaan: REFACTOR dulu → MIGRASI baru → FITUR BARU terakhir.**
   Alasan: refactor jadi lapisan akses data yang rapi selagi masih pakai
   Supabase, supaya nanti migrasi ke Prisma cuma ganti isi
   repository/query-nya, tidak perlu sentuh tiap halaman/komponen.
3. **ID tetap UUID (string), bukan auto-increment integer** — supaya kode
   Next.js yang sudah ada (routing, tipe data) tidak perlu dirombak total.
4. **Auth pindah dari Supabase Auth ke NextAuth.js — SUDAH DIKERJAKAN**
   (Credentials + JWT, tanpa Prisma Adapter penuh karena tidak perlu OAuth)
   — tabel `profiles` jadi tabel user utama, kolom `password_hash` dipakai.
   Detail implementasi ada di bagian "Progres Sejauh Ini". Versi yang
   dipakai: **`next-auth@5.0.0-beta.32`** (Auth.js v5), BUKAN v4 stabil —
   dipilih karena `peerDependencies`-nya eksplisit menyatakan dukungan
   Next.js 16, dan API-nya (`auth()`/`signIn()`/`signOut()` native App
   Router + Server Actions) jauh lebih cocok dengan arsitektur proyek ini
   dibanding v4 yang App Router supportnya lebih lama/berat. Trade-off:
   masih beta, bukan versi "stable" — kalau ada masalah kompatibilitas di
   kemudian hari, ini kandidat pertama yang dicurigai.
5. **Pola refactor file besar** (SUDAH diterapkan & terbukti aman di
   `src/features/admin/actions/` dan `src/features/kasi/actions/`): file
   besar → folder berisi beberapa file kecil per domain + `shared.ts` untuk
   helper bersama + `index.ts` barrel yang me-re-export semua named export
   dengan nama persis sama, supaya TIDAK ADA import lain di seluruh project
   yang perlu diubah. Logika fungsi di-copy PERSIS, tidak boleh berubah
   sama sekali saat refactor struktur (verifikasi pakai `npx tsc --noEmit`
   + `npm run build` + baca ulang diff manual per fungsi).
   - Helper yang di file asli TIDAK di-`export` (dipakai internal saja)
     tetap TIDAK di-`export` di `shared.ts`, KECUALI dipakai lintas file
     domain (baru di-`export` seperlunya).
   - `shared.ts` **JANGAN** diberi direktif `"use server"` kalau isinya ada
     helper sync (bukan async) — Next.js mewajibkan semua export di file
     `"use server"` berupa fungsi async. Pola lain di codebase
     (`src/features/reports/statusLogs.ts`, `slaEvents.ts`) juga begitu:
     modul helper server-side biasa TIDAK perlu `"use server"`, itu hanya
     wajib di file yang exportnya dipanggil langsung sebagai Server Action
     dari client (form `action=`, `useActionState`, dsb).
6. **Data Supabase lama TIDAK dimigrasikan ke MySQL.** Database MySQL mulai
   dari kosong (sudah kejadian — migration awal cuma bikin skema, bukan
   data), akan diisi seed data dummy untuk testing/demo. Jangan buat
   script migrasi data Supabase→MySQL, itu bukan rencana.
7. **Foto laporan/verifikasi pindah ke penyimpanan lokal server**
   (folder `public/uploads`), BUKAN cloud storage lagi. Ini belum
   dikerjakan (masih pakai Supabase Storage sampai fase swap data layer
   menyentuh file-file terkait) — dicatat di sini supaya keputusannya
   tidak hilang sebelum waktunya dikerjakan.

### ATURAN TETAP — RLS Supabase → otorisasi eksplisit di level aplikasi

Supabase RLS (Row Level Security) **tidak ada padanannya** di Prisma/MySQL.
Setiap kali mengganti satu query Supabase ke Prisma di fase swap data layer
(TERMASUK yang sudah dikerjakan di fase Auth ini):

1. **WAJIB cek dulu** apakah tabel yang disentuh punya RLS policy di
   migration lama — cek folder `supabase/migrations/` dan cari string
   `ENABLE ROW LEVEL SECURITY` atau `CREATE POLICY`. Catatan: migration
   awal (pembuatan tabel `profiles`, dll) TIDAK ada di folder ini secara
   lokal — kalau ragu suatu tabel punya RLS tapi migration-nya tidak
   ketemu, tanyakan ke pengguna daripada asumsi "tidak ada RLS".
2. Kalau ada RLS policy yang relevan, **pastikan filter yang sama ditulis
   eksplisit** di `where` clause query Prisma penggantinya. Contoh: kalau
   RLS lama membatasi Kasi cuma bisa lihat laporan section-nya sendiri,
   query Prisma pengganti WAJIB tetap punya
   `where: { assignedSectionId: profile.sectionId }` yang setara — jangan
   sampai hilang begitu saja karena "toh Prisma bisa select semua".
3. Ini paling krusial untuk **kebenaran DAN keamanan** aplikasi, bukan
   sekadar soal query benar — kegagalan menerapkan ini berarti user bisa
   melihat/mengubah data yang seharusnya tidak boleh mereka akses.

**Preseden yang sudah diterapkan** (fase Auth, 2026-09-02):
`authorize()` di NextAuth mencari `profiles` by email (tanpa filter
tambahan — ini memang harus tanpa filter karena tujuannya justru mencari
user manapun untuk verifikasi kredensial, setara service-role Supabase).
`getProfile()` query `profiles` by `session.user.id` — otomatis self-scoped
karena id-nya berasal dari sesi milik user itu sendiri, tidak ada
kemungkinan lihat profil user lain. Tidak ditemukan RLS policy pada tabel
`profiles` di `supabase/migrations/` lokal (base schema tidak tercatat di
situ), tapi secara desain query di atas sudah aman by construction.

## Skema Database MySQL (Prisma) — SUDAH DI-MIGRATE

`prisma/schema.prisma` sudah ada di project (27 model), sudah diverifikasi
cross-check terhadap seluruh pemanggilan Supabase (`.from()/.select()/
.insert()/.update()`) di semua `src/features/**/queries.ts` dan
`actions.ts`/`actions/**/*.ts` — TIDAK ADA mismatch tabel/kolom. Migration
awal (`prisma/migrations/20260902055204_init`) sudah dijalankan ke database
MySQL lokal `lapor-aja-db` (Laragon) dan menghasilkan 27 tabel model +
`_prisma_migrations` (28 total), cocok persis dengan jumlah model di schema.

Berisi tabel lama (dari dump Supabase) + tabel baru untuk Cabang 3
(`performance_snapshots`) dan Cabang 5 (`swadaya_campaigns`,
`swadaya_contributions`), plus kolom baru `escalation_level` di
`report_sla_alert_notifications` untuk Cabang 2. Tabel-tabel baru ini masih
KOSONG/belum dipakai kode manapun — itu memang wajar, menunggu fase "FITUR
BARU".

**Setup tooling:**
- `prisma`/`@prisma/client` di-pin ke **v6.19.3** (BUKAN v7.x/latest) —
  Prisma 7 mengubah format datasource (`url` di block `datasource` sudah
  tidak didukung, wajib pindah ke `prisma.config.ts` + driver adapter).
  Schema project ini pakai format klasik `url = env("DATABASE_URL")` yang
  cuma didukung di Prisma 6.x. Kalau nanti `npm install prisma` tanpa
  pin versi, akan otomatis narik v7 dan `prisma generate`/`migrate` akan
  gagal validasi — selalu pin ke `^6`.
- `DATABASE_URL` ada di **DUA** file: `.env.local` (dipakai Next.js runtime)
  dan `.env` (dipakai Prisma CLI, yang TIDAK baca `.env.local`). Keduanya
  sudah ter-gitignore (`.env*`).
- Kredensial lokal: `mysql://root:@127.0.0.1:3306/lapor-aja-db` (Laragon,
  no password). Kalau `prisma migrate`/`generate` gagal dengan "Can't reach
  database server", cek dulu apakah service MySQL di Laragon sudah start —
  jangan tebak-tebak ubah kredensial sendiri.

Enum penting yang sudah dikonfirmasi dari database asli:
- `user_role`: public, admin, kepala_desa, sekdes, kepala_dusun, kasi
- `sla_status` asli: on_time, at_risk, overdue, completed (rencana tambah
  "critical" untuk Cabang 1)
- `report_status`: pending, approved, rejected, need_verification,
  verified_valid, verified_invalid, classified, handled_by_village,
  forwarded_to_agency, waiting_budget, in_progress, resolved, archived,
  merged

## Progres Sejauh Ini

**FASE REFACTOR: SELESAI TOTAL** (2026-09-02) — semua file besar yang
teridentifikasi di awal sudah dipecah, tidak ada lagi file `.ts` di
`src/features/**` yang lebih dari 800 baris. Detail per file:

- [x] `src/features/admin/actions.ts` (1944 baris) → direfactor jadi folder
  `actions/` (reportLifecycle.ts 390 baris, classification.ts 413 baris,
  relations.ts 677 baris, officialLetters.ts 467 baris, shared.ts 19 baris,
  index.ts 21 baris). Build + tsc bersih, semua consumer import tidak
  berubah. **PENTING — catatan insiden:** sempat tercatat "sudah selesai"
  di dokumen ini dari sesi sebelumnya, TAPI ternyata hasil sesi itu ada di
  sandbox terpisah dan tidak pernah benar-benar diterapkan ke working tree
  (working tree masih file tunggal 1944 baris sampai direfactor ulang pada
  2026-09-02). Jangan percaya checklist di dokumen ini tanpa verifikasi
  `ls`/`Glob` ke working tree dulu kalau ada keraguan.
- [x] `src/features/kasi/actions.ts` (1016 baris) → direfactor jadi folder
  `actions/` (assignment.ts 402 baris — returnKasiReportAssignment,
  startKasiReportProgress, submitKasiProgressUpdate; budgetAndResolution.ts
  375 baris — submitKasiBudgetRequest, resolveKasiReport; shared.ts 266
  baris — requireKasi() + helper bersama; index.ts 10 baris). Build + tsc
  bersih.
- [x] `src/features/admin/queries.ts` (1032 baris) → direfactor jadi folder
  `queries/` (reports.ts 456 baris — getAdminReports, getAdminReportDetail,
  getAdminReportReviewOptions; classification.ts 138 baris —
  getAdminAssetClassificationReports(Detail); followUp.ts 80 baris —
  getAdminFollowUpReports, getAdminArchivedReports; masterData.ts 178
  baris — getActiveAgencies, getActiveVillageSections,
  getActiveSlaPriorityOptions; officialLetters.ts 180 baris — 4 fungsi
  surat resmi; shared.ts 9 baris — LIST_LIMIT,
  isMissingReportRelationsError; index.ts 25 baris). Build + tsc bersih.
- [x] `src/features/village/queries.ts` (1689 baris, FILE TERBESAR) →
  direfactor jadi folder `queries/` (dashboard.ts 191 baris,
  sla.ts 118 baris, users.ts 159 baris — termasuk getVillageSectionOptions
  yang konsumennya ternyata di halaman users bukan reports, dicek via grep
  konsumen dulu; reports.ts 796 baris — domain paling kompleks,
  getVillageReportMonitoringDetail sendiri butuh banyak query paralel;
  budget.ts 425 baris; shared.ts 10 baris — isMissingDatabaseRelationError,
  uniqueValues; index.ts 23 baris). Build + tsc bersih.
- [x] Migrasi Prisma + MySQL — `prisma/schema.prisma` sudah di tempat,
  `npx prisma generate` + `npx prisma migrate dev --name init` sudah
  jalan sukses, 27 tabel model ter-buat di `lapor-aja-db`. Lihat bagian
  "Skema Database MySQL" di atas untuk detail versi/env setup.
- [x] Sapuan file besar lain (2026-09-02) — dicek semua `.ts` di
  `src/features/**`, tidak ada lagi yang >800 baris. File terbesar yang
  tersisa saat itu (belum tentu perlu direfactor, sekadar catatan):
  `village/queries/reports.ts` (796, mepet tapi kohesif satu domain),
  `master-data/actions.ts` (767 — lihat entri di bawah, sudah direfactor
  juga di sesi berikutnya), `admin/actions/relations.ts` (677),
  `village/actions.ts` (663, belum pernah disentuh), `reports/
  slaAlertNotifications.ts` (580), `kasi/queries.ts` (576), `reports/
  internalNotifications.ts` (531).
- [x] `src/features/master-data/actions.ts` (767 baris) → direfactor jadi
  folder `actions/` per entitas (categories.ts 146 baris, dusuns.ts 149
  baris, agencies.ts 165 baris, slaRules.ts 198 baris, villageSections.ts
  103 baris, shared.ts 33 baris — requireAdmin() DAN
  requireMasterDataManager() dipertahankan keduanya meski isinya identik
  persis, karena bukan bagian "murni reorganisasi" kalau dikonsolidasi;
  index.ts 12 baris). Build + tsc bersih.

**FASE AUTH: SELESAI** (2026-09-02) — fondasi untuk fase swap data layer.
- [x] **Swap Supabase Auth → NextAuth.js** (`next-auth@5.0.0-beta.32`,
  Credentials + JWT — lihat "Keputusan Arsitektur" poin 4 untuk alasan
  pilih versi beta v5, bukan v4 stabil). Yang dikerjakan:
  - `src/lib/prisma.ts` (baru) — singleton Prisma client.
  - `src/lib/auth/auth.ts` (baru) — config NextAuth: Credentials provider,
    `authorize()` query `profiles` via Prisma + `bcrypt.compare`, cek
    `is_active`, JWT strategy, `role`/`dusunId`/`sectionId` disimpan di
    token supaya tidak perlu query ulang untuk klaim dasar itu.
  - `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts`
    (baru) — route handler + type augmentation Session/User/JWT.
  - `getUser()`/`getProfile()` di `src/lib/auth/` — swap ke NextAuth
    session + Prisma, **signature & return type (`UserProfile` snake_case)
    dijaga identik persis** dengan versi Supabase lama, jadi
    `requireAuth()`, `requireRole()`, dan seluruh 25+ pemanggil lain di
    project **TIDAK disentuh sama sekali**.
  - `src/features/auth/actions.ts` (tadinya file kosong) — diisi
    `loginUser`/`registerUser` sebagai Server Action (pola
    `useActionState`, konsisten dengan seluruh app). Registrasi:
    `role: public, is_active: true` langsung tanpa konfirmasi email
    (keputusan pengguna, lihat poin 6-7 di "Keputusan Arsitektur").
  - `LoginForm.tsx`, `RegisterForm.tsx` — diubah dari client-side
    `supabase.auth.*` jadi Server Action `loginUser`/`registerUser`.
    `LogoutButton.tsx` — pakai `signOut()` dari `next-auth/react`
    (client-side) supaya urutan toast-lalu-redirect tetap sama seperti
    sebelumnya.
  - Pesan error login dibedakan ("email/password salah" vs "akun
    dinonaktifkan") lewat pre-check eksplisit di `loginUser` SEBELUM
    panggil `signIn()` NextAuth — sengaja tidak bergantung ke tipe error
    internal NextAuth v5 yang masih beta dan bisa berubah.
  - **Diverifikasi dengan smoke test nyata** (bukan cuma build): dev
    server dijalankan, 1 user uji dibuat, login lewat REST endpoint
    NextAuth langsung (`/api/auth/callback/credentials` +
    `/api/auth/session`) — dikonfirmasi: password benar → session berisi
    `role`/`id`/`dusunId`/`sectionId` yang benar; password salah → tidak
    ada session; akun `is_active:false` dengan password benar → tetap
    ditolak. Data & proses uji sudah dibersihkan setelahnya.
  - **Bug ikutan yang ditemukan & diperbaiki**: `src/features/settings/
    actions.ts` fungsi `updateOwnPassword` masih panggil
    `supabase.auth.updateUser()` — otomatis rusak begitu Auth di-swap
    (tidak ada lagi sesi Supabase Auth untuk di-update). Sudah diperbaiki
    jadi `bcrypt.hash()` + `prisma.profile.update({ passwordHash })`.
    Fungsi lain di file yang sama (`updateOwnProfile`, avatar upload,
    notifikasi preferensi) MASIH pakai Supabase (storage + `.from()`) —
    itu memang belum di-scope, menunggu fase swap data layer.
  - **Belum diverifikasi lewat browser sungguhan** (cuma REST API +
    build) — sebelum dianggap 100% siap pakai, test manual di browser:
    login, register, logout, ganti password, dan cek redirect-by-role
    masih benar untuk tiap role.
  - **Diketahui belum beres, dicatat supaya tidak terlupa:**
    - `src/lib/supabase/client.ts` (browser client) sekarang **tidak
      dipakai sama sekali** (satu-satunya consumer sebelumnya adalah 3
      file auth yang barusan di-swap) — dibiarkan ada dulu (instruksi sesi
      ini: jangan sentuh file supabase lain), tapi ini kandidat dihapus di
      pass cleanup nanti.
    - Trigger Postgres yang dulu auto-membuat baris `profiles` saat
      Supabase `signUp()` tidak pernah ditemukan di
      `supabase/migrations/` lokal (kemungkinan besar dibuat manual lewat
      dashboard/SQL editor Supabase, tidak pernah masuk migration file) —
      jadi sekarang `registerUser` yang eksplisit bikin baris `profiles`,
      tapi kalau ternyata ada logika lain di trigger asli yang kelewat
      (mis. field tambahan), tidak akan ketahuan dari membaca kode.

**FASE SWAP DATA LAYER: MODUL INTI SELESAI (2026-09-03) — alur "submit
laporan → admin review → kepala dusun verifikasi → admin klasifikasi → kasi
tangani → selesai" sudah 100% jalan end-to-end lewat Prisma/MySQL,
diverifikasi nyata via browser otomatis (Playwright), bukan cuma tsc/build.**

**INSIDEN yang membuktikan kenapa fase ini penting & berbahaya kalau
setengah-setengah** (Settings, ditemukan lewat testing manual sebelum sesi
ini, sudah diperbaiki): `getSettingsProfile()` sempat query `profiles`
langsung ke Supabase Postgres padahal identitas user login sekarang cuma ada
di MySQL → crash "Cannot coerce the result to a single JSON object". Build/
tsc TIDAK mendeteksi kelas bug ini karena secara tipe semuanya valid — cuma
ketauan lewat testing manual/smoke test yang benar-benar query database.
**Prinsip ini terbukti lagi di sesi ini**: klarifikasi temuan 🔴 sesi lalu
("apakah `createReport` gagal karena FK constraint ke Supabase") ternyata
BUKAN soal FK — tes langsung ke Supabase pakai anon key membuktikan itu RLS
policy violation (`new row violates row-level security policy`, kode error
Postgres 42501), karena `createClient()` (anon key) tidak pernah lagi punya
sesi Supabase Auth valid sejak Auth di-swap ke NextAuth — jadi SEMUA
`createClient()` (bukan cuma yang sengaja diblokir RLS) berjalan sebagai
role `anon`. Solusinya sama: swap ke Prisma, yang otomatis bypass RLS
Postgres karena Prisma bicara ke MySQL, bukan Postgres.

**Modul yang di-swap ke Prisma sesi ini (semua diverifikasi build + tsc,
sebagian besar juga diverifikasi via smoke test/E2E browser nyata):**
- [x] `src/features/settings/queries.ts` + `actions.ts` — full Prisma untuk
  `profiles`. Avatar tetap Supabase Storage (layanan terpisah, aman).
- [x] `src/features/reports/*` (actions.ts, queries.ts, statusLogs.ts,
  slaEvents.ts, statusNotifications.ts, whatsappNotifications.ts,
  internalNotifications.ts, slaAlertNotifications.ts) — **full swap sebagai
  satu kesatuan modul**, sesuai instruksi "jangan setengah-setengah".
  `createReport` juga sekalian dipindah upload foto laporan dari Supabase
  Storage ke lokal: `public/uploads/reports/<report_id>/<file>`, path
  disimpan di kolom `file_path`/`photo_url` yang sudah ada.
- [x] `src/features/village/actions.ts` — `createVillageUser`,
  `updateVillageUser`, `toggleVillageUserStatus` di-swap ke pola yang sama
  seperti `registerUser` (Prisma + bcrypt hash password). SEBELUMNYA
  `createVillageUser` masih pakai `adminSupabase.auth.admin.createUser()`
  (Supabase Auth) — akun yang dibuat lewat situ TIDAK PERNAH bisa login
  NextAuth. Ini sudah benar sekarang.
  **CATATAN: fungsi lain di file yang sama** (`approveBudgetRequest`,
  `rejectBudgetRequest`, `hasReportProgressUpdates`, `requireBudgetReviewer`)
  **BELUM disentuh**, masih Supabase — bukan bagian alur inti yang dites
  hari ini (jalur peninjauan anggaran Kepala Desa), tapi kena risiko RLS
  yang sama, catat untuk sesi berikutnya.
- [x] `src/features/admin/queries/{reports,classification,masterData}.ts`
  dan `src/features/admin/actions/{reportLifecycle,classification}.ts` —
  full Prisma. **BELUM disentuh saat itu** (di luar scope E2E test hari
  itu): `admin/queries/followUp.ts` (sudah di-swap Ronde 1),
  `admin/queries/officialLetters.ts`, `admin/actions/relations.ts`,
  `admin/actions/officialLetters.ts` (tiga terakhir ini masih Supabase per
  2026-09-03 — lihat "Landmine 🟡 yang TERSISA" di bawah untuk status
  terkini, jangan percaya paragraf historis ini untuk status sekarang).
- [x] `src/features/hamlet-head/queries.ts` + `actions.ts` — full Prisma.
  `verifyReport` sekalian dipindah upload foto verifikasi dari Supabase
  Storage ke lokal: `public/uploads/verifications/<report_id>/
  <verification_id>/<file>`.
- [x] `src/features/kasi/queries.ts` + `actions/{shared,assignment,
  budgetAndResolution}.ts` — full Prisma. Upload foto progres/penyelesaian
  Kasi sekalian dipindah ke lokal: `public/uploads/progress/<user_id>/
  <report_id>/<progress_update_id>/<file>`.
- [x] `src/features/village/queries/users.ts` — full Prisma (dibutuhkan
  supaya dropdown "Penugasan Seksi"/"Penugasan Dusun" di halaman Kelola
  Pengguna menampilkan data MySQL, bukan Supabase yang sudah tidak
  sinkron).

**Verifikasi E2E nyata (Playwright, browser sungguhan, bukan simulasi)** —
seluruh alur berikut dites lewat klik form asli, bukan panggil fungsi
langsung: (1) Kepala Desa buat akun Kasi via Kelola Pengguna → (2) warga
daftar + submit laporan dengan foto → (3) Admin approve untuk verifikasi →
(3b) **Kepala Dusun verifikasi laporan — langkah wajib di alur status
aplikasi yang tidak disebutkan eksplisit di rencana awal, tapi memang harus
ada di antara "admin approve" dan "admin klasifikasi"** → (4) Admin
klasifikasi + assign ke seksi Kasi → (5) Kasi mulai proses → (6) Kasi
selesaikan laporan (status akhir `resolved`). **Semua 7 langkah berhasil.**
Data uji (5 akun, 1 laporan, foto-foto terkait) sudah dibersihkan total dari
MySQL dan disk setelahnya — akun asli pengguna (`admin@gmail.com`,
`stevan@gmail.com`) tidak tersentuh sama sekali di sepanjang proses ini.

**Bug baru ditemukan saat E2E test (pra-ada, BUKAN dari swap data layer)**:
`src/features/kasi/components/KasiReportActionPanel.tsx` — dua `<textarea
name="note">` di form berbeda ("Update Progres" dan "Tandai Selesai")
sama-sama dapat `id="note"` dari komponen `Textarea` (id = name, tidak
di-scope per-form). HTML `id` wajib unik per dokumen; akibatnya
`<label for="note">` pada form kedua salah sasaran ke textarea form
pertama. Tidak kelihatan lewat klik mouse biasa (mouse klik posisi visual,
bukan lewat asosiasi label), tapi ini bug aksesibilitas nyata untuk
pengguna keyboard/screen-reader, dan sempat menjegal automated testing
(`getByLabel` mengikuti asosiasi `for`/`id`, bukan posisi visual). **Belum
diperbaiki** — di luar scope data-layer, kandidat perbaikan kecil di sesi
manapun yang menyentuh komponen ini.

**Setup tooling tambahan sesi ini:**
- `playwright` (+ Chromium binary) dipasang sebagai devDependency khusus
  untuk E2E testing browser sungguhan (Server Action Next.js tidak bisa
  dites via curl biasa — butuh protokol `Next-Action` header yang
  di-generate saat build, jadi browser asli satu-satunya cara realistis).
  **Sengaja DIPERTAHANKAN** (bukan dihapus setelah dipakai) untuk sesi E2E
  test berikutnya — `npm uninstall playwright` kapan saja kalau ternyata
  tidak dipakai lagi.
- `public/uploads/{reports,verifications,progress}/` — subfolder lokal
  untuk foto, dibuat otomatis oleh kode saat runtime (tidak perlu
  pre-create). `.gitignore` sudah diatur (`/public/uploads/*` diabaikan,
  `.gitkeep` di root folder dipertahankan).

**Riwayat landmine 🟡 — Ronde 1 (SELESAI, 2026-09-03 sesi siang):**
`admin/queries/followUp.ts`, `village/queries/budget.ts` (+
`village/actions.ts` `approveBudgetRequest`/`rejectBudgetRequest`),
`village/queries/reports.ts`, dan `village/queries/dashboard.ts` (dashboard
utama Kepala Desa/Sekdes, ditemukan & diperbaiki sekalian meski tidak
disebut eksplisit di permintaan awal ronde ini) — semua sudah di-swap ke
Prisma, termasuk perbaikan pola foto (`createSignedUrl` Supabase Storage
→ `toDisplayUrl()` lokal) di `village/queries/reports.ts`.

**Riwayat landmine 🟡 — Ronde 2 (SELESAI, 2026-09-03 sesi sore), ditemukan
lewat sapuan grep penuh `createClient`/`createAdminClient` di seluruh
`src/`:**
- [x] `village/queries/sla.ts` (`getVillageSlaMonitoringData`,
  `getVillageHeatmapReports`) — halaman Monitoring SLA & Heatmap Kepala
  Desa/Sekdes. Prioritas tertinggi ronde ini karena langsung berhubungan
  dengan tema TA. Perhitungan status SLA efektif (`calculateEffectiveSlaStatus`
  di `src/lib/sla.ts`) TIDAK diubah sama sekali, cuma sumber datanya.
- [x] `dashboard/queries.ts` (`getAdminDashboardStats`, `getRecentReports`)
  — dashboard utama **Admin** (`/dashboard/admin`), landmine paling sering
  diakses karena ini halaman pertama yang dilihat admin setiap login.
- [x] `citizen/queries.ts` (`getCitizenDashboardData`, `getCitizenReports`,
  `getCitizenReportDetail`) — tiga halaman "Laporan Saya" milik warga biasa
  (`/dashboard/public`, `/dashboard/public/reports`,
  `/dashboard/public/reports/[id]`), sekaligus perbaikan pola foto (sama
  seperti village). Ini landmine yang paling terlihat langsung oleh
  masyarakat umum, bukan cuma staf desa.
- [x] `master-data/queries.ts` + `master-data/actions/{categories,dusuns,
  agencies,slaRules,villageSections}.ts` — BACA dan TULIS kelima halaman
  "Kelola Data Master". Sebelumnya split-brain total: form CRUD di halaman
  ini menulis ke Supabase sementara seluruh bagian lain aplikasi (dropdown
  klasifikasi laporan, dsb) sudah baca dari Prisma — jadi apa pun yang
  admin tambah/ubah di sini **tidak pernah** muncul di aplikasi yang
  sedang jalan. Ini kemungkinan besar alasan tabel `categories`/`dusuns`/
  `village_sections`/`sla_rules` di MySQL kosong total sebelum ronde ini.
  Diverifikasi paling meyakinkan: tambah kategori baru lewat UI Kelola
  Data Master, kategori itu langsung muncul di dropdown klasifikasi
  laporan Admin (dibuktikan lewat Playwright, dua arah: tersimpan di MySQL
  DAN terbaca balik oleh Prisma di form lain).
  **Catatan temuan sampingan** (bukan bug baru, desain lama yang baru
  ketahuan): `SlaRule.priority` di skema Prisma diberi `@unique` (satu
  baris per prioritas), tapi logika `toggleSlaRuleStatus` yang asli
  ditulis dengan asumsi bisa ada beberapa baris SLA per prioritas
  (nonaktifkan "sibling" saat mengaktifkan salah satu). Karena kolomnya
  sekarang unik, sibling itu tidak akan pernah ada — efeknya menonaktifkan
  satu-satunya aturan SLA untuk suatu prioritas akan selalu ditolak oleh
  pengecekan "harus ada minimal satu aturan aktif". Ini "gagal aman", jadi
  TIDAK diubah (sesuai aturan jangan ubah logika bisnis saat swap), tapi
  perlu diketahui kalau nanti ada rencana punya beberapa versi SLA rule
  per prioritas.

**Riwayat landmine 🟡 — Ronde 3 (SELESAI, 2026-09-03 sesi malam) — SEMUA
landmine split-brain dari sapuan grep `createClient`/`createAdminClient`
sudah beres:**
- [x] `notifications/{queries,actions}.ts` — lonceng notifikasi navbar
  (`getNavbarNotifications`, `markNavbarNotificationsAsRead`), dipanggil
  di `(dashboard)/layout.tsx` untuk SEMUA role di SETIAP halaman dashboard.
  Diverifikasi lewat Playwright: alur nyata warga lapor → admin setujui →
  kepala dusun verifikasi → notifikasi "Verifikasi selesai" langsung
  muncul di lonceng Admin.
- [x] `admin/actions/relations.ts` (`linkRelatedReport`,
  `bulkMergeDuplicateReports`, `bulkMarkRecurringReports`) — panel gabung
  laporan duplikat/berulang di halaman detail laporan Admin. Diverifikasi:
  2 laporan digabung sebagai duplikat lewat UI, dikonfirmasi ke database
  (relasi tersimpan, laporan sumber berstatus `merged`).
- [x] Avatar upload dipindah dari Supabase Storage ke local storage —
  `settings/actions.ts` (`updateOwnProfile`) sekarang simpan ke
  `public/uploads/avatars/<user_id>/avatar.<ext>`, sama pola dengan foto
  laporan/verifikasi/progres. `settings/queries.ts` dan
  `app/(dashboard)/layout.tsx` dibaca lewat `toDisplayUrl()` lokal,
  bukan `createSignedUrl` Supabase lagi. Diverifikasi: ganti foto profil
  lewat UI, foto tampil sebagai `<img>` valid setelah reload, tidak ada
  pesan error.
- [x] `admin/queries/officialLetters.ts` + `admin/actions/officialLetters.ts`
  — alur draf/finalisasi/kirim Surat Resmi (`createOfficialLetter`,
  `finalizeOfficialLetter`, `sendOfficialLetterEmail`) di-swap ke Prisma.
  Diverifikasi: buat surat resmi baru untuk laporan `forwarded_to_agency`
  lewat UI, berhasil (status `draft`, isi teks). **PDF generation SENGAJA
  TIDAK disentuh di ronde ini** — lihat keputusan di bawah.

**Keputusan (2026-09-03, masih berlaku): generate PDF surat resmi MASUK
cakupan TA** — ini fitur baru, BUKAN cuma perbaikan split-brain migrasi.
Kolom `pdf_url`/`file_path` di tabel `official_letters` ada di skema tapi
TIDAK PERNAH diisi kode manapun — surat cuma berupa teks subjek+isi yang
dikirim sebagai badan email, tidak ada file PDF sungguhan sama sekali.
**Status: BELUM MULAI dikerjakan sama sekali, perlu riset pendekatan
teknis dulu** (library apa yang dipakai untuk generate PDF di Next.js —
misal `@react-pdf/renderer`, `pdf-lib`, atau render HTML→PDF via headless
browser — dan di mana file hasilnya disimpan, kemungkinan besar
`public/uploads/letters/` mengikuti pola lokal yang sudah ada). Belum
diputuskan detailnya, jangan mulai implementasi sebelum ini didiskusikan.
**Ini satu-satunya open item split-brain/migrasi yang tersisa** — semua
landmine 🟡 lain (Ronde 1, 2, 3) sudah selesai per catatan di atas.

- [ ] Seed data dummy untuk testing/demo (database MySQL saat ini kosong
  total setelah semua data uji dibersihkan, keputusan sudah diambil untuk
  TIDAK migrasikan data Supabase lama) — belum dikerjakan.

**FASE FITUR BARU: DIMULAI (2026-09-03 sesi malam)** — beda karakter dari
fase sebelumnya (migrasi/refactor): sekarang menambah logika bisnis baru,
bukan cuma pindah cara bicara ke database. Progres per cabang:

**Cabang 1a — SELESAI.** Status waktu otomatis 4 level (Aman/Peringatan/
Kritis/Terlambat):
- `src/lib/sla.ts` (`calculateEffectiveSlaStatus`) — rumus diganti dari
  "sisa waktu ≤ 25% dari total durasi" (2 level: on_time/at_risk) jadi
  **persentase waktu terpakai dari total durasi SLA** (`created_at` →
  `resolution_due_at`), dengan 3 titik potong:
  - **< 60% terpakai → Aman (on_time)**
  - **60%–84% terpakai → Peringatan (at_risk)**
  - **85%–99% terpakai → Kritis (critical)** — level baru
  - **≥ 100% terpakai (lewat `resolution_due_at`) → Terlambat (overdue)**
  **Kenapa 60/85/100, bukan 75/90/100 atau simetris lain:** dipilih supaya
  "Peringatan" muncul lebih awal (60%, bukan mepet ke akhir) — memberi
  staf desa jendela waktu bertindak SEBELUM laporan masuk fase "Kritis",
  bukan cuma diberitahu setelah nyaris terlambat. Titik "Kritis" di 85%
  masih menyisakan sedikit ruang gerak (15% durasi) sebelum benar-benar
  lewat tenggat. **Catat persis rasionalisasi ini kalau ditanya sidang** —
  ini keputusan desain, bukan angka sembarang.
  Enum `SlaStatus`/`SlaAlertType` di `prisma/schema.prisma` SUDAH punya
  nilai `critical` dari migrasi sebelumnya, jadi 1a murni kerja di
  application logic (`src/lib/sla.ts`), tidak perlu migration skema baru
  untuk kolomnya sendiri (migration baru yang dijalankan sesi ini adalah
  untuk hal lain — lihat poin unique constraint di bawah).
- **Semua tempat tampil status ini sudah diupdate** (dipetakan lengkap
  saat riset sebelum implementasi, lihat juga "Kesimpulan dari Task 1"):
  `village/components/VillageSlaTable.tsx` (badge oranye + ikon
  `AlertOctagon` untuk Kritis, ditempatkan di antara badge kuning
  Berisiko dan merah Terlambat), `app/(dashboard)/dashboard/village/sla/
  page.tsx` (kartu statistik baru "Kritis" di antara "Berisiko" dan
  "Terlambat", grid 7→8 kolom), `app/(dashboard)/dashboard/admin/
  reports/[id]/page.tsx` (label "Kritis" ditambah ke `formatEnum` lokal
  file itu). Warna oranye ditambahkan sebagai token semantik baru
  (`--critical-50/100/600/700`) di `src/app/globals.css` di dalam blok
  `@theme inline`, mengikuti pola persis token success/warning/danger/
  info yang sudah ada (bukan warna Tailwind mentah ditulis inline).
  Dashboard utama Admin (`dashboard/queries.ts`) SENGAJA tidak disentuh —
  cuma hitung `isEffectiveSlaOverdue()` (true/false overdue saja), tidak
  menampilkan 4 level, dan tidak diminta eksplisit.
- **Bug ikutan yang ditemukan & diperbaiki sekalian** (bukan bagian asli
  1a, tapi ditemukan saat kerja di file yang sama): tabel
  `report_sla_alert_notifications` ternyata **tidak pernah punya unique
  constraint** meski kodenya (`createSlaAlertLock` di
  `src/features/reports/slaAlertNotifications.ts`) mengasumsikan ada dan
  menangkap error `P2002` sebagai "duplikat" — tangkapan itu dead code
  sejak awal, jadi setiap kali alert SLA disapu (tombol manual atau
  endpoint cron `/api/notifications/sla-alerts`), sistem berpotensi
  insert baris alert dobel dan kirim ulang email/WhatsApp untuk laporan
  yang levelnya tidak berubah. Diperbaiki dengan
  `@@unique([reportId, alertType])` — **SENGAJA TIDAK** menyertakan
  `escalationLevel` di constraint (itu menentukan SIAPA yang diberi
  tahu, bukan level keparahan; kalau ikut disertakan, nanti pas Cabang 2
  bikin `escalationLevel` bervariasi, level keparahan yang sama bisa
  tercatat berkali-kali dan constraint-nya jadi tidak berguna). Migration
  baru: `prisma/migrations/20260903211236_add_sla_alert_unique_constraint/`
  (dibuat manual via `prisma migrate diff` + `prisma migrate deploy`,
  karena `prisma migrate dev` menolak jalan di shell non-interaktif —
  bukan mengedit migration lama). `sendSlaAlertNotifications()` sekarang
  juga memicu alert untuk level "critical", bukan cuma at_risk/overdue.
  Diverifikasi 3 lapis: insert dobel `(report_id, alert_type)` sengaja
  dibuat dan ditolak MySQL (`P2002`), insert dengan `alert_type` beda
  untuk laporan yang sama tetap berhasil (constraint tidak overshoot),
  dan test fungsional nyata lewat browser (laporan dengan 90% waktu
  terpakai + klik tombol "Send SLA Alerts" → 1 baris alert `critical`
  tersimpan).
- **Diverifikasi visual dengan data nyata**: 4 laporan uji dibuat dengan
  `created_at`/`resolution_due_at` dimanipulasi supaya jatuh tepat di
  30%/70%/92%/120% waktu terpakai, discreenshot di halaman Monitoring SLA
  sebagai Kepala Desa — keempat badge (hijau/kuning/oranye/merah) dan
  kartu statistik tampil benar di kolom yang tepat. Data uji dibersihkan
  total setelahnya.

**Cabang 1b & 1c — SELESAI (2026-09-04 sesi sore/malam), dikerjakan
sekaligus karena keduanya sama-sama landing di titik kode yang sama
(`approveReportForVerification`)**, plus 4 keputusan desain yang perlu
dicatat di sini karena relevan buat sidang:

- **KEPUTUSAN 1 — kategori override MENGGANTIKAN MUTLAK aturan priority,
  bukan dikombinasikan.** Kalau kategori laporan punya baris di
  `sla_category_thresholds`, prioritas yang dipilih admin (rendah/sedang/
  tinggi/darurat) tetap disimpan untuk klasifikasi tapi **sama sekali
  tidak** dipakai untuk hitung durasi SLA — durasi dari kategori menang
  penuh. Alasan: `SlaCategoryThreshold` sejak awal didesain `@@unique
  ([categoryId])`, satu baris per kategori tanpa dimensi priority sama
  sekali — desain itu sudah mengisyaratkan "kategori menang mutlak"
  sebelum implementasi dimulai, jadi dikonfirmasi eksplisit sebagai
  keputusan resmi, bukan cuma tafsir kode.
- **KEPUTUSAN 2 — hari kerja SELALU aktif, bukan opsional per kategori.**
  Kolom `use_business_days` yang tadinya ada di `sla_category_thresholds`
  (dari desain awal migrasi) **dihapus** lewat migration baru
  (`prisma/migrations/20260904163526_add_national_holidays_drop_category_business_days/`).
  Alasan: kalkulasi hari kerja adalah aturan universal yang berlaku sama
  untuk semua laporan tanpa kecuali — punya toggle per kategori cuma
  menambah kerumitan tanpa ada kebutuhan nyata untuk mematikannya
  sebagian.
- **KEPUTUSAN 3 — sumber hari libur nasional.** Model baru
  `NationalHoliday` (date unik, description), diseed lewat
  `prisma/seedNationalHolidays.mjs` (bisa dijalankan ulang untuk tahun
  berikutnya). **2026: 17 hari resmi dari SKB 3 Menteri** (ditetapkan 19
  September 2025, dicek langsung ke setneg.go.id). **2027: 17 hari
  PERKIRAAN** — SKB resmi 2027 belum terbit saat data ini disusun, jadi
  tanggal hari raya lunar (Imlek/Nyepi/Idul Fitri/Idul Adha/Waisak/
  Maulid/1 Muharam) dan Paskah dihitung mengikuti pola pergeseran tahun
  sebelumnya, ditandai `(perkiraan)` di tiap baris kode. **Perlu di-update
  begitu SKB 2027 resmi terbit** — cek ulang tanggalnya sebelum sidang
  kalau masih pakai data ini.
- **KEPUTUSAN 4 — algoritma hitung mundur per jam, basis UTC.**
  `calculateBusinessAwareDueDate()` (`src/lib/sla.ts`) bergerak maju per
  jam dari waktu mulai, melompati jam yang jatuh di hari
  Sabtu/Minggu/tanggal `NationalHoliday`. Perbandingan hari SENGAJA pakai
  komponen UTC (bukan waktu lokal server) supaya hasilnya deterministik
  di mana pun kode dijalankan (mesin dev WIB vs kemungkinan deploy production
  yang defaultnya UTC) — dijelaskan lengkap di komentar fungsi. Berlaku
  untuk **verification_due_at DAN resolution_due_at** sekaligus.
  `extendDueDateByPauseWindow()` di `village/actions.ts` (pergeseran
  tenggat karena jeda anggaran) **SENGAJA TIDAK disentuh** — itu konteks
  berbeda, bukan kalkulasi dari jam SLA.

**Implementasi:** `approveReportForVerification`
(`admin/actions/reportLifecycle.ts`) sekarang: (1) cek dulu
`slaCategoryThreshold` untuk kategori yang dipilih — kalau ada, pakai
durasinya dan lewati lookup `SlaRule` sepenuhnya; kalau tidak ada,
fallback ke `SlaRule` by priority seperti sebelumnya; (2) durasi final
(dari sumber manapun) dihitung jadi `verification_due_at`/
`resolution_due_at` lewat `calculateBusinessAwareDueDate()`, bukan
`now + jam` mentah lagi. Catatan audit `report_sla_events` juga jujur
soal sumber durasinya ("berdasarkan ambang batas khusus kategori" vs
"untuk prioritas X"). Form Kelola Data Master > Kategori
(`master-data/components/{CategoryCreateModal,CategoryTable}.tsx`) dapat
2 field opsional "Durasi verifikasi khusus (jam)" dan "Durasi
penyelesaian khusus (jam)" — kosong = pakai priority, diisi keduanya =
upsert baris `sla_category_thresholds`, keduanya dikosongkan lagi saat
edit = baris terhapus. Model `Category.slaThreshold` juga dirapikan dari
`SlaCategoryThreshold[]` jadi relasi 1-ke-1 yang sebenarnya (constraint
`@@unique([categoryId])` di database sudah menjaminnya sejak awal, ini
cuma perbaikan tipe Prisma Client, tidak perlu migration).

**Diverifikasi dengan data nyata lewat browser (Playwright)**: dusun +
2 kategori uji dibuat lewat UI Kelola Data Master (satu diisi override
6 jam verifikasi/24 jam penyelesaian, satu dibiarkan kosong). Laporan
dengan kategori override di-approve dengan priority "tinggi" (yang
seharusnya 48/96 jam) dipilih SENGAJA salah — hasilnya tetap 24 jam
penyelesaian, membuktikan override menang mutlak. Laporan dengan
kategori biasa + priority "tinggi" tetap pakai 96 jam (fallback jalan).
Approval dilakukan Jumat 4 September 2026 09:54 UTC — kedua tenggat
terbukti melompati akhir pekan penuh: yang 24 jam jatuh ke **Senin** (bukan
Sabtu kalau dihitung mentah), yang 96 jam jatuh ke **Kamis** (bukan Selasa
kalau dihitung mentah) — dikonfirmasi lewat perhitungan referensi
independen yang cuma beda ~150 milidetik (waktu round-trip query) dari
hasil aktual. Data uji dibersihkan total setelahnya.

**Cabang 2 — SELESAI (2026-09-04 sesi lanjutan)**, dikerjakan sekaligus
2a+2b karena keduanya berhubungan langsung (2b butuh status SLA yang
sama seperti dipakai 2a untuk memutuskan siapa yang dialert):

- **KEPUTUSAN 1 — pemetaan tetap alert_type → escalation_level**:
  `at_risk` → `level_1`, `critical` → `level_2`, `overdue` → `level_3`.
  Tidak bisa diubah lewat konfigurasi, hardcode di
  `ALERT_TYPE_ESCALATION_LEVEL` (`src/features/reports/
  slaAlertNotifications.ts`) — makin parah levelnya, makin tinggi
  eskalasinya, sesuai urutan keparahan yang sudah ditetapkan di Cabang 1a.
- **KEPUTUSAN 2 — penerima KUMULATIF per level, bukan daftar terpisah**:
  level_1 = semua Kasi aktif di `assigned_section_id` laporan. **Fallback**:
  kalau laporan belum diklasifikasi admin (`assigned_section_id` masih
  null — kondisi nyata yang ditemukan saat investigasi: laporan bisa
  sudah kena hitungan mundur SLA sejak status `need_verification`, jauh
  sebelum ada Kasi yang bisa dianggap bertanggung jawab), kirim ke semua
  Admin aktif sebagai ganti. level_2 = level_1 + semua Admin aktif.
  level_3 = level_2 + semua Kepala Desa & Sekdes aktif. Dedupe by profile
  id (`resolveAlertRecipients()`) — penerima yang sudah masuk di level
  bawah tidak dikirimi ulang saat level di atasnya juga mencakup dia.
  **Kenapa kumulatif, bukan daftar terpisah per level**: supaya orang
  yang sudah tahu dari level rendah tetap dapat notifikasi eskalasi lebih
  lanjut (bukan cuma orang BARU di level itu yang tahu), sesuai logika
  eskalasi asli — Admin di level 2 seharusnya tahu juga saat naik ke
  level 3, bukan cuma Kepala Desa yang baru ditambahkan.
- **KEPUTUSAN 3 — tidak ada halaman watchlist baru**: 3 halaman kerja
  harian yang SUDAH ADA diperluas — `/dashboard/kasi/reports` (query-nya
  dulu bahkan tidak fetch `resolutionDueAt` sama sekali), `/dashboard/
  admin/reports` (tombol "Saring"/"Ekspor" dulu dekorasi kosong, sekarang
  benar-benar wired), `/dashboard/village/sla` (dulu sudah ada 4-level
  badge dari Cabang 1a tapi nol filter). **Alasan**: investigasi
  membuktikan ketiga halaman ini SUDAH punya kerangka "daftar laporan
  milik saya/tim saya" per role — bikin halaman keempat/kelima cuma akan
  duplikasi kerangka yang sama dengan data yang(mostly) sama, menambah
  beban maintenance tanpa manfaat nyata. `SlaStatusBadge` diekstrak jadi
  komponen bersama (`src/features/reports/components/SlaStatusBadge.tsx`)
  supaya 3 halaman ini konsisten satu sumber warna/label, bukan 3 salinan
  yang bisa mulai berbeda seiring waktu.
- **Implementasi**: `createSlaAlertLock()` sekarang benar-benar mengisi
  `escalationLevel` sesuai pemetaan (dulu selalu default `level_1` apa pun
  keparahannya — dead code sejak awal). Pesan notifikasi dapat 1 kalimat
  konteks tambahan khusus penerima Kasi ("Laporan ini ditugaskan ke seksi
  Anda...") karena Kasi baru pertama kali jadi penerima jenis alert ini.
  Filter di `/dashboard/admin/reports` pakai URL query param (bisa
  di-bookmark/dibagikan, sesuai keputusan desain eksplisit); filter di
  `/dashboard/kasi/reports` dan `/dashboard/village/sla` pakai client-side
  state, konsisten dengan pola `VillageReportsTable` yang sudah ada
  sebelumnya di sisi village. Ekspor CSV (`GET /api/exports/reports`)
  ditulis manual tanpa library, ikut filter yang sama dengan yang sedang
  aktif di halaman, khusus role admin.
- **Diverifikasi dengan data nyata lewat browser (Playwright)**: alur
  penuh warga lapor → admin approve (SENGAJA belum diklasifikasi) → alert
  `at_risk` dikirim → dibuktikan cuma Admin yang dapat (fallback, karena
  `assigned_section_id` masih null) → laporan diklasifikasi ke 1 seksi uji
  yang sudah punya 1 Kasi uji → alert `critical` dikirim → dibuktikan Kasi
  seksi itu DAN semua Admin dapat, Kepala Desa belum → alert `overdue`
  dikirim → dibuktikan Kepala Desa ikut masuk. Dedupe dicek ketat pakai
  `Set` di tiap tahap — tidak ada satu pun penerima yang dapat notifikasi
  dobel. Filter di ketiga halaman dan ekspor CSV juga dicoba nyata lewat
  browser, terbukti benar-benar menyaring jumlah baris (bukan dekorasi
  seperti tombol lama). Data uji dibersihkan total setelahnya.

**Cabang 3 — SELESAI (2026-09-04 sesi lanjutan)**, Evaluasi Kinerja.
Karakter fase ini beda dari Cabang 1/2: bukan cuma logic baru di jalur yang
sudah ada, tapi 2 model skema baru (`PerformanceSnapshot` didesain ulang
total) DAN data historis dummy — dikerjakan lewat 6 tugas berurutan.

- **KEPUTUSAN 1 — skema PerformanceSnapshot didesain ulang SEBELUM
  implementasi, per-SEKSI bukan per-Kasi individu.** Enum
  `PerformanceScope.kasi` diganti `seksi`, kolom `profileId` **dihapus**
  total dari skema (migration
  `prisma/migrations/20260904213806_performance_snapshot_per_seksi/`,
  aman karena tabelnya masih kosong — 0 baris dicek sebelum migrate).
  **Alasan teknis yang jadi dasar keputusan ini (WAJIB bisa dijelaskan
  ulang saat sidang kalau ditanya "kenapa bukan per Kasi?")**: diinvestigasi
  dulu sebelum keputusan diambil, ditemukan 2 fakta penting di skema yang
  sudah ada —
  1. `ReportSectionAssignment.assignedTo` (kolom yang SEHARUSNYA jadi
     penanda "Kasi individu mana yang menangani laporan ini") **tidak
     pernah diisi oleh kode manapun**, di semua alur yang ada. Satu-satunya
     penanda "siapa/tim mana yang menangani" yang benar-benar terisi
     konsisten adalah `Report.assignedSectionId` — level SEKSI/TIM, bukan
     individu.
  2. `ReportProgressUpdate.createdBy` justru SELALU terisi benar dengan id
     Kasi yang beraksi — tapi `ProgressStatus` enum (`plan, progress,
     budget_request, escalation_request, completion_submission,
     review_note`) **tidak punya nilai "resolved"**, dan
     `resolveKasiReport` (Kasi menandai laporan selesai) menulis baris
     progress dengan `updateType: "progress"` yang sama seperti update
     progres biasa — jadi tidak ada cara bersih mengidentifikasi "baris
     progress mana yang merupakan tindakan PENYELESAIAN laporan" tanpa
     inferensi rapuh berbasis kedekatan timestamp ke `resolvedAt`.
  Kesimpulan: memaksakan atribusi ke Kasi individu berarti membangun fitur
  evaluasi kinerja di atas data yang secara desain skema TIDAK PERNAH
  benar-benar merekam "Kasi individu mana yang bertanggung jawab" —
  hasilnya akan terlihat presisi (nama orang) tapi sebenarnya cuma tebakan.
  Per-seksi jujur terhadap apa yang benar-benar direkam sistem, dan tetap
  actionable untuk keputusan desa (satu seksi biasanya beranggota sedikit
  Kasi, jadi "seksi mana yang perlu dibantu" tetap informasi berguna).
- **KEPUTUSAN 2 — 3a/3b live query dari `Report`, TIDAK PERNAH menyentuh
  `PerformanceSnapshot`.** `PerformanceSnapshot` HANYA dipakai untuk 3c
  (predikat). **Alasan**: 3a/3b butuh data yang selalu real-time dan bisa
  difilter bebas (ganti periode kapan saja, lihat bulan mana saja) — kalau
  dipaksa baca dari snapshot, snapshot harus di-generate untuk SETIAP
  kombinasi periode yang mungkin dilihat orang, yang berarti butuh
  scheduler/cron (yang TIDAK ADA infrastrukturnya sama sekali di proyek
  ini, dikonfirmasi saat investigasi awal — tidak ada
  `SLA_ALERT_CRON_SECRET`, tidak ada `vercel.json`, satu-satunya pola
  "terjadwal" yang ada adalah tombol manual). Live query dari `Report`
  jauh lebih sederhana dan otomatis selalu akurat. `PerformanceSnapshot`
  sebaliknya COCOK untuk 3c karena predikat memang harus jadi "catatan
  yang dibekukan" — begitu ditentukan untuk suatu periode, hasilnya tidak
  boleh diam-diam berubah kalau ada laporan baru masuk/berubah status
  setelahnya (predikat "Januari" harus tetap sama isinya biar pun dilihat
  lagi bulan Maret).
- **KEPUTUSAN 3 — `totalReports` = laporan yang `resolvedAt` jatuh dalam
  rentang periode**, BUKAN "semua laporan yang pernah ditugaskan ke seksi
  itu". Artinya laporan yang masih berjalan (belum resolved) tidak
  dihitung sama sekali di periode manapun sampai benar-benar selesai —
  konsisten dengan makna "evaluasi kinerja penyelesaian", bukan "beban
  kerja".
- **KEPUTUSAN 4 — skor komposit predikat (3c): 70% persen tepat waktu +
  30% skor kecepatan** (rata-rata jam penyelesaian dinormalisasi relatif
  antar seksi yang dibandingkan pada periode yang sama — seksi tercepat di
  antara yang dibandingkan dapat skor kecepatan 100, seksi terlambat
  mendekati 0). Bobot 70/30 dipilih supaya persentase tepat waktu (metrik
  kepatuhan SLA yang sebenarnya) tetap dominan, kecepatan cuma pembeda
  kedua untuk menghargai seksi yang selesai jauh sebelum tenggat (bukan
  cuma pas-pasan). Syarat minimum **3 laporan selesai** per seksi supaya
  seksi bervolume kecil tidak otomatis menang cuma karena kebetulan.
  Konstanta ini ada di `ON_TIME_WEIGHT`/`SPEED_WEIGHT`/
  `MIN_REPORTS_THRESHOLD` (`src/features/village/performanceActions.ts`)
  kalau perlu diubah.
- **KEPUTUSAN 5 — generate ulang predikat untuk periode yang SAMA
  MENIMPA (upsert), bukan menumpuk baris baru atau ditolak.** Unique key
  `@@unique([periodType, periodStart, periodEnd, scopeType])` di
  `PerformanceSnapshot` (skema TIDAK menyertakan `sectionId`, karena
  cuma ada SATU baris "pemenang" per periode, bukan satu baris per seksi
  yang dievaluasi). Alasan lengkap dan pertimbangannya ditulis sebagai
  komentar langsung di `schema.prisma` di atas model ini: predikat
  mewakili "keputusan akhir" untuk periode itu; membiarkan banyak baris
  untuk periode yang sama cuma bikin riwayat predikat membingungkan
  (predikat mana yang "benar"?), sementara menolak generate ulang sama
  sekali terlalu kaku untuk kebutuhan koreksi data. **Diverifikasi nyata**:
  generate predikat 2x berturut-turut untuk periode yang sama menghasilkan
  ID baris dan `createdAt` yang identik (baris lama di-update, bukan baris
  baru).
- **Implementasi**: `src/lib/performancePeriod.ts` (fungsi murni tanggal,
  tidak sentuh database — hitung rentang bulanan/triwulanan, jendela tren,
  daftar pilihan periode untuk dropdown). `src/features/village/queries/
  performance.ts` (`getVillagePerformanceData` untuk 3a/3b — 1x fetch
  laporan resolved mencakup seluruh jendela tren lalu di-bucket per
  periode di memori, bukan query berulang per periode;
  `getPerformancePredicateHistory` untuk daftar riwayat predikat).
  `src/features/village/performanceActions.ts` (`generatePerformancePredicate`
  — pola manual-trigger sama seperti tombol "Send SLA Alerts" yang sudah
  ada, karena memang tidak ada infrastruktur cron). Halaman baru
  `/dashboard/village/performance` (Kepala Desa/Sekdes, digerbangi lewat
  `village/layout.tsx` yang sudah ada): filter periode via URL query
  (`?tipe=&periode=`, pola sama seperti `AdminReportFilterBar`), 4 kartu
  statistik, chart tren area stack (tepat waktu vs terlambat, warna dari
  token `--success`/`--danger` yang sudah ada), 2 tabel breakdown (seksi +
  kategori) dengan bar chart ranking persen tepat waktu — gaya visual
  mengikuti `VillageAnalyticsCharts.tsx` (chart tren/area adalah tipe
  chart PERTAMA di codebase ini, sebelumnya cuma ada pie + horizontal
  bar). Link navigasi baru "Evaluasi Kinerja" ditambahkan ke sidebar
  Kepala Desa/Sekdes (`dashboardNavigation.tsx`).
- **Data seed demo (SENGAJA DIBIARKAN TERSIMPAN di database, TIDAK
  dihapus)**: `prisma/seedPerformanceDemoData.mjs` (dijalankan manual
  sekali, sudah dieksekusi sesi ini) membuat 5 kategori + 4 dusun + 3 seksi
  desa + aturan SLA 4 prioritas (nama realistis, BUKAN diberi label
  "Demo" — ini data referensi sungguhan yang dibutuhkan aplikasi jalan
  normal) DAN 83 laporan tersebar 4 bulan terakhir dengan **bias performa
  sengaja berbeda antar seksi** (Seksi Pembangunan onTimeBias 0.82, dua
  seksi lain 0.55-0.6) supaya demo predikat punya pemenang yang jelas dan
  bisa dibuktikan, bukan kebetulan. **Semua akun pelapor & Kasi demo
  diberi nama berawalan "Demo -"** (mis. "Demo - Warga 1", "Demo - Kasi
  Seksi Pembangunan") supaya gampang dibedakan dari data asli — **kalau
  sesi lain menemukan banyak laporan "Demo -" di database, INI ALASANNYA,
  bukan bug atau data nyasar.** Password akun demo (kalau perlu login
  manual saat demo): `Demo12345!`. Tidak ada `ReportStatusLog`/
  `ReportProgressUpdate` dibuat untuk laporan-laporan ini (sengaja
  dilewati, cukup untuk kebutuhan statistik agregat 3a/3b/3c yang murni
  baca kolom `Report` langsung — detail laporan demo per-item tidak akan
  punya riwayat status kalau dibuka).
- **Diverifikasi dengan data seed lewat browser (Playwright)**: dihitung
  dulu secara independen (skrip terpisah, rumus sama persis dengan
  aplikasi) performa tiap seksi per bulan dari data seed — ditemukan bulan
  Agustus 2026 (bulan lalu) dimenangkan Seksi Pelayanan Umum (variasi
  acak di sampel kecil membalik keunggulan Pembangunan bulan itu),
  sementara Juni 2026 dimenangkan telak oleh Seksi Pembangunan (100%
  tepat waktu, 13/13). Login sebagai akun `kepala_desa` uji sementara
  (dibuat khusus sesi ini, dihapus lagi setelahnya — tidak ada akun
  kepala_desa/sekdes permanen di database) → buka halaman → total
  laporan berubah sesuai periode yang dipilih (16 vs 23, bukan chart
  statis) → generate predikat Juni 2026 → toast & database membuktikan
  Seksi Pembangunan menang → generate ULANG untuk periode SAMA → database
  membuktikan tetap 1 baris (ID & `createdAt` sama, upsert bukan
  duplikat) → riwayat predikat menampilkan entri tersebut setelah reload.
  Semua 13 assertion lolos di percobaan pertama. Baris predikat Juni 2026
  hasil verifikasi ini **SENGAJA DIBIARKAN tersimpan** (bukan dihapus
  seperti akun uji) — dianggap bagian wajar dari data demo, bukan artefak
  test yang perlu dibersihkan, supaya saat didemokan nanti fitur ini
  sudah terlihat "pernah dipakai", bukan tombol yang belum pernah diklik.
  Bug kecil (aksesibilitas, bukan fungsional) ditemukan & diperbaiki
  sekalian: dropdown filter periode di halaman ini tidak punya `id`/`name`
  sama sekali (ikut pola `AdminReportFilterBar` yang juga begitu) sehingga
  label tidak terasosiasi — diperbaiki dengan menambah `name="tipe"`/
  `name="periode"` di `VillagePerformanceFilterBar.tsx`.

**Cabang 4 — SELESAI (2026-09-05)**, Transparansi & Akuntabilitas. Diawali
investigasi read-only (5 pertanyaan: reuse Playwright vs library PDF baru,
opsi Excel, kelayakan halaman tanpa login, cakupan audit trail aksi baru
Cabang 1-3, risiko bias data demo) sebelum keputusan diambil dan kode
ditulis — 5 keputusan berikut dicatat SEBELUM implementasi dimulai:

- **KEPUTUSAN 1 — `Report.isDemoData` (Boolean, default `false`), BUKAN
  cuma pola nama "Demo -" yang dipakai Cabang 3.** Migration baru
  (`prisma/migrations/20260905053131_add_demo_flag_and_predicate_generated_by/`),
  di-UPDATE ke `true` untuk 83 laporan demo (join ke `reporter.fullName`
  berawalan "Demo -") lewat script sekali-jalan, sisanya (1 laporan asli)
  tetap `false`. **Alasan penting untuk sidang**: sebelum kolom ini ada,
  SATU-SATUNYA cara membedakan data demo dari data asli adalah join manual
  ke nama pelapor — rapuh (typo nama, ganti pola penamaan di sesi lain,
  dsb bisa diam-diam merusak filter) dan mahal (butuh join setiap query).
  Kolom boolean eksplisit di tabel `Report` sendiri jauh lebih aman dan
  cepat untuk keperluan yang sifatnya kritis-benar (4c publik WAJIB selalu
  benar mengecualikan data demo).
- **KEPUTUSAN 2 — `PerformanceSnapshot.generatedBy` (nullable, FK ke
  `Profile`).** Predikat Juni 2026 dari sesi Cabang 3 (dibuat akun uji
  yang sudah dihapus) TIDAK di-backfill — dibiarkan `null` apa adanya,
  bukan bug. Predikat baru (Juli 2026 dan seterusnya) otomatis terisi
  dengan siapa yang klik tombol "Tentukan Predikat Periode Ini".
- **KEPUTUSAN 3 — 4b (ekspor internal) pakai toggle "sertakan data
  contoh" (default OFF, boleh ON); 4c (halaman publik) TIDAK PERNAH punya
  toggle, SELALU exclude data demo, hardcode di query.** Alasan bedanya:
  4b dipakai staf desa sendiri yang tahu konteks data demo ada dan kenapa
  (berguna untuk demo sistem ke penguji/dosen pembimbing dengan angka yang
  "hidup"), sementara 4c dilihat masyarakat umum yang TIDAK tahu ada data
  demo sama sekali — membiarkan opsi apapun untuk menampilkannya ke publik
  berisiko menyesatkan warga soal kinerja desa yang sebenarnya.
- **KEPUTUSAN 4 — halaman 4c genuinely ANONIM (tanpa login sama sekali),
  bukan "role public yang tetap wajib login".** Diinvestigasi dulu:
  ternyata sudah ada presedan halaman publik tanpa login
  (`(public)/reports/create` — warga bisa kirim laporan tanpa akun,
  `getProfile()` cuma dipakai untuk redirect STAF yang kebetulan sedang
  login, bukan gerbang akses). `/statistik-sla` mengikuti pola yang
  sama persis: tidak ada `getProfile()`/`requireAuth()`/`requireRole()`
  sama sekali di halaman maupun query-nya. **Jebakan yang ditemukan &
  diperbaiki saat build**: halaman yang tidak memanggil cookies/auth
  apapun otomatis di-treat Next.js App Router sebagai STATIS dan
  di-prerender SEKALI saat `npm run build` — untuk halaman statistik yang
  wajib selalu menampilkan data terkini, ini serius (angka beku sejak
  build terakhir, bukan cuma soal SEO). Diperbaiki dengan
  `export const dynamic = "force-dynamic"` di halaman.
- **KEPUTUSAN 5 — Playwright (sudah ada sebagai devDependency untuk E2E
  testing sejak fase migrasi) DIPINDAH ke `dependencies` dan DIREUSE untuk
  render PDF, TIDAK install `puppeteer` terpisah.** `exceljs` diinstall
  baru untuk `.xlsx` asli (CSV yang sudah ada di Cabang 2 tidak bisa
  dicontoh untuk Excel — `.xlsx` itu ZIP berisi banyak file XML, beda
  kelas masalah dari CSV yang cuma teks berdelimiter). **Rasionalisasi
  Playwright, PENTING untuk sidang kalau ditanya "kenapa bukan library PDF
  biasa"**: Chromium milik Playwright (~700MB) sudah ter-download di mesin
  ini untuk keperluan testing — install `puppeteer` akan men-download
  Chromium KEDUA yang fungsinya identik, murni pemborosan disk. Trade-off
  yang WAJIB diketahui: proyek ini belum punya `Dockerfile`/`vercel.json`,
  jadi belum terverifikasi apakah cara deploy production nanti akan tetap
  men-download browser Chromium Playwright saat install (beberapa
  pipeline CI/deploy sengaja skip download browser atau prune cache) —
  risiko ini dicatat juga di README.md (bagian "Deployment risk").

**Implementasi 4a (audit trail)**: `createReportStatusLog()`
(`src/features/reports/statusLogs.ts`) dapat parameter opsional
`changedBy` — **ini memperbaiki bug laten yang ditemukan sambil kerja**:
sebelumnya fungsi ini SELALU `return` diam-diam (skip nulis log) kalau
tidak ada sesi login (`getProfile()` return `null`), padahal endpoint cron
`/api/notifications/sla-alerts` memanggil alur ini TANPA sesi sama sekali
(otorisasinya bearer secret, bukan NextAuth) — kalau tidak diperbaiki,
alert yang dipicu cron tidak akan PERNAH punya audit trail, cuma yang
dipicu tombol manual (ada sesi) yang tercatat. `sendSlaAlertNotifications()`
sekarang menulis 1 baris `report_status_logs` per alert yang benar-benar
terkirim (`oldStatus === newStatus` dengan sengaja — status alur laporan
TIDAK berubah, cuma alert terkirim; `notifyReporter`/`notifyWhatsApp`
dimatikan supaya tidak memicu notifikasi "status berubah" palsu ke
pelapor). `generatePerformancePredicate()` mengisi `generatedBy`.
**Koreksi penting**: instruksi awal menyebut verifikasi harus muncul di
`ReportSlaEventTimeline.tsx` — setelah dibaca, komponen itu ternyata HANYA
merender tabel `report_sla_events` (event `deadline_started`/
`paused_budget`/dst), BUKAN `report_status_logs`. Entry alert yang baru
ditulis justru tampil di **`ReportStatusTimeline.tsx`** (komponen terpisah
yang sudah ada sebelumnya, dipakai di 5 halaman detail laporan berbeda) —
dicatat di sini supaya sesi lain tidak salah tempat mencari kalau perlu
menelusuri ulang.

**Implementasi 4b (ekspor)**: `getPerformanceExportData()`
(`village/queries/performance.ts`) — query terpisah dari 3a/3b, menerima
`includeDemo: boolean` yang memfilter `isDemoData` di level `where` Prisma
untuk SELURUH angka (ringkasan, breakdown, DAN baris detail), bukan cuma
disembunyikan dari tampilan. 2 route baru: `GET /api/exports/performance/
pdf` (render HTML lewat `buildPerformancePdfHtml()` di
`village/performanceExport.ts`, jadi PDF via `page.setContent()` +
`page.pdf()`, browser Chromium dibuka-tutup per request) dan
`GET /api/exports/performance/excel` (2 sheet: "Ringkasan" berisi kartu
statistik + breakdown seksi/kategori, "Detail Laporan" satu baris per
laporan dengan kolom "Data Contoh: Ya/Tidak" — transparan kalau toggle
di-ON). Keduanya dibatasi role Kepala Desa/Sekdes, parameter query
`tipe`/`periode` sinkron dengan filter halaman, `demo=1|0` dari toggle.

**Implementasi 4c (halaman publik)**: `/statistik-sla`
(`src/app/(public)/statistik-sla/page.tsx` + `src/features/public/
queries.ts`, feature folder baru) — total laporan ditangani, persen tepat
waktu, breakdown per kategori, all-time (tidak difilter periode, sengaja
sesederhana mungkin sesuai deskripsi awal "halaman ringkas"). Tidak ada
detail per laporan/nomor laporan/nama pelapor/lokasi. Link ditambahkan di
2 tempat: halaman login (`AuthLayout.tsx` dapat slot `secondaryLink`
opsional baru) dan halaman `/reports/create`.

**Diverifikasi dengan data nyata lewat browser (Playwright), login sebagai
akun Kepala Desa PERMANEN** (`kepaladesa@gmail.com` — dibuat sesi ini
sekalian, lihat catatan akun baru di bawah): (1) laporan uji overdue
dibuat → klik "Send SLA Alerts" → dikonfirmasi baris `report_status_logs`
baru tersimpan dengan `changedBy` = ID Kepala Desa yang klik DAN teks
alert-nya tampil sungguhan di halaman detail laporan; (2) generate
predikat untuk periode BARU (Juli 2026) → `generatedBy` terisi benar,
riwayat predikat menampilkan "oleh Kepala Desa Kucur"; (3) 1 laporan ASLI
(bukan demo) sengaja ditambahkan ke Juni 2026 (bulan yang sudah punya 23
laporan demo) khusus untuk pembuktian toggle — Excel toggle OFF
menampilkan total 1 (cuma laporan asli), toggle ON menampilkan total 24
(23 demo + 1 asli), PDF dikonfirmasi file valid (`%PDF` magic bytes); (4)
halaman `/statistik-sla` dibuka di browser context ANONIM baru (tanpa
cookie sesi sama sekali) → berhasil diakses, menampilkan "Laporan
Ditangani: 1" (BUKAN 74 yang merupakan total termasuk demo) — angka ini
dibandingkan langsung dengan angka ekspor internal toggle-ON (24) untuk
periode yang sama, terbukti berbeda nyata, bukan toggle kosmetik. Semua 25
assertion lolos. **Insiden lingkungan (bukan bug kode)**: percobaan
pertama gagal total karena cache dev server Turbopack (folder `.next`)
korup/stale setelah rangkaian panjang migration+generate+build sebelum
dev server dinyalakan — SEMUA halaman `/dashboard/village/*` sempat 404
padahal filenya ada; diperbaiki dengan hapus `.next` + restart bersih.
Data uji (2 laporan sementara, 1 profil pelapor uji, baris alert/
notifikasi/status-log terkait) dibersihkan total setelah verifikasi — DB
kembali ke baseline Cabang 3 (84 laporan: 83 demo + 1 asli) plus 2 baris
`PerformanceSnapshot` (Juni + Juli 2026) yang SENGAJA dibiarkan tersimpan
sebagai artefak demo yang legitimate, sama seperti keputusan Cabang 3.

**Akun baru sesi ini (PERMANEN, bukan uji)**: `kepaladesa@gmail.com`
(password `KepalaDesa2026!`, role `kepala_desa`) dan `sekdes@gmail.com`
(password `Sekdes2026!`, role `sekdes`) — sebelumnya TIDAK ADA akun
kepala_desa/sekdes permanen sama sekali di database, jadi seluruh halaman
Kepala Desa/Sekdes (termasuk `/dashboard/village/performance` dari Cabang
3) tidak bisa dicoba langsung tanpa membuat akun uji sekali pakai setiap
sesi. Sekarang bisa langsung dipakai untuk demo/sidang.

**Cabang 5 — SELESAI (2026-09-05)**, Percepatan Penyelesaian via Swadaya
Masyarakat. **INI CABANG TERAKHIR — SELURUH 5 CABANG RENCANA TA SUDAH
SELESAI DIKERJAKAN.** Diawali investigasi read-only (alur `rejectBudgetRequest`,
mekanisme jeda SLA yang ada, preseden `(public)/reports/create`, skema
`SwadayaContribution` yang sudah didesain sejak migrasi awal, pola upload
foto, navigasi dashboard warga) sebelum 6 keputusan berikut diambil:

- **KEPUTUSAN 1 — REUSE status `waiting_budget` untuk jeda SLA swadaya,
  BUKAN bikin status/enum baru.** Ini keputusan paling penting untuk
  dijelaskan saat sidang. Alasan teknis: `calculateEffectiveSlaStatus()`
  (`src/lib/sla.ts`) punya early-return eksplisit
  `if (status === "waiting_budget") return "paused_budget"` — jeda SLA di
  seluruh sistem ini SUDAH 100% terikat ke satu nilai status itu, bukan ke
  tanggal. Reuse berarti: **nol migration skema baru, nol perubahan ke
  `calculateEffectiveSlaStatus`, nol halaman tampilan baru** — badge/status
  yang sudah ada otomatis "paham" laporan ini sedang dijeda. Satu-satunya
  yang perlu ditambah adalah CARA MEMBEDAKAN sumber jeda (anggaran vs
  swadaya) untuk keperluan TAMPILAN saja: dicek lewat keberadaan
  `SwadayaCampaign` yang masih `open` untuk laporan itu
  (`getOpenSwadayaCampaignReportIds()`), BUKAN dari nilai status itu
  sendiri yang tetap sama. Trade-off yang disadari sejak awal: label
  internal `SlaEventType`/`SlaStatus` ("paused_budget"/"resumed_budget")
  tetap generik secara nama kolom — presisinya cuma ada di teks `note`
  bebas yang ditulis eksplisit ("...karena galang swadaya masyarakat...",
  BUKAN "...karena anggaran...") setiap kali aksi swadaya menyentuh audit
  trail, dan di flag UI `hasActiveSwadayaCampaign` untuk badge. Alternatif
  yang DITOLAK: bikin status baru (`waiting_swadaya`) — teknisnya tetap
  mudah (migration enum sudah biasa dilakukan di proyek ini), tapi akan
  butuh update ke banyak titik tampilan sekaligus (persis seperti
  pengalaman nambah status "Kritis" di Cabang 1a yang menyentuh 3 file
  berbeda) untuk manfaat yang tidak sepadan — presisi label ekstra yang
  bisa dicapai lebih murah lewat flag UI saja.
- **KEPUTUSAN 2 — Kontribusi WAJIB login, untuk SEMUA role (tidak
  dibatasi cuma warga/"public"), BEDA SENGAJA dengan Cabang 4c yang
  anonim sepenuhnya.** Alasan bedanya, penting untuk sidang: Cabang 4c
  (`/statistik-sla`) itu MEMBACA data agregat publik — tidak ada risiko
  penyalahgunaan karena tidak ada state yang berubah. Kontribusi swadaya
  itu MENULIS data finansial/klaim tenaga kerja atas nama seseorang —
  investigasi lebih dulu membuktikan **tidak ada satu pun jalur tulis-data
  anonim di seluruh codebase ini** (termasuk `/reports/create` yang
  disangka anonim ternyata TETAP redirect ke login di server action-nya,
  cuma halamannya yang bisa dilihat tanpa akun) dan **tidak ada satu pun
  mekanisme rate-limiting/anti-spam** di proyek ini — membuka tulis-data
  anonim pertama kali justru untuk fitur donasi/klaim kontribusi adalah
  risiko yang tidak sepadan. `contributorId`/`contributorName`/
  `contributorPhone` SELALU diambil dari `getProfile()` di server,
  form-nya cuma menampilkan readonly, TIDAK PERNAH dipercaya dari input
  — supaya tidak ada celah mengatasnamakan orang lain sekalipun sudah
  login.
- **KEPUTUSAN 3 — kontribusi uang murni pencatatan manual, TIDAK ADA
  integrasi payment gateway sungguhan.** Konsisten dengan skema
  `SwadayaContribution` yang sejak awal desain migrasi cuma punya kolom
  `amount` + `status` (pending/verified/received/rejected) tanpa kolom
  transaksi/referensi pembayaran apapun — desain skema itu sendiri sudah
  mengisyaratkan pencatatan manual sejak awal, bukan integrasi nyata.
- **KEPUTUSAN 4 — buka campaign MANUAL lewat tombol, BUKAN otomatis/cron
  seperti disebut di draf awal cabang ini ("melewati ambang waktu
  tertentu").** Konsisten dengan Cabang 3c (predikat kinerja) yang juga
  manual — proyek ini memang tidak punya infrastruktur cron sama sekali
  (`SLA_ALERT_CRON_SECRET` tidak pernah diisi, tidak ada `vercel.json`).
  Eligibilitas: laporan sudah ditugaskan ke seksi (`assignedSectionId`
  terisi) DAN belum `resolved` — Admin/Kepala Desa/Sekdes selalu boleh,
  Kasi cuma boleh untuk laporan seksinya sendiri (dicek server-side, bukan
  cuma disembunyikan di UI).
- **KEPUTUSAN 5 — target dana ambil dari `ReportBudgetRequest` TERAKHIR
  untuk laporan itu (nilai `totalEstimatedBudget`-nya), TERLEPAS status
  budget request itu sendiri (termasuk yang `rejected`), fallback ke
  `targetNote` teks bebas kalau memang belum pernah ada pengajuan
  anggaran sama sekali.** Ini masuk akal karena budget request yang
  ditolak BUKAN berarti estimasinya salah — cuma berarti desa tidak bisa
  membiayainya, sehingga estimasi itu tetap jadi acuan target yang wajar
  untuk swadaya. **Diverifikasi nyata**: budget request Rp500.000 ditolak,
  campaign dibuka tanpa mengisi target manual, target otomatis Rp500.000
  tetap muncul di halaman.
- **KEPUTUSAN 6 — "diverifikasi" dan "diterima" adalah 2 tahap TERPISAH**
  (`pending→verified→received`), masing-masing dengan aktor dan waktu
  sendiri (`verifiedBy`/`verifiedAt` vs `receivedBy`/`receivedAt`/
  `receivedNote`/`proofPhotoPath` — 4 kolom baru, migration Tugas 1 sesi
  ini). Alasan: verifikasi cuma mengonfirmasi janji/klaim kontribusi itu
  masuk akal, BUKAN berarti barang/dana sudah benar-benar di tangan desa
  — memisahkannya mencegah situasi "tercatat diterima" padahal baru
  dijanjikan. `receiveSwadayaContribution` menolak dieksekusi kalau
  kontribusi belum `verified`, jadi tahapnya betul-betul dipaksa berurutan.

**Implementasi**: modul baru `src/features/reports/swadaya{Queries,Actions}.ts`
(diletakkan di `reports/`, bukan `village/`, karena dipakai lintas 4 peran:
Admin, Kepala Desa/Sekdes, Kasi, dan warga). Komponen:
`SwadayaOpenCampaignButton.tsx` (tombol buka, muncul di 3 halaman detail
laporan sekaligus — Admin/Village/Kasi), `SwadayaSection.tsx` (progres +
daftar kontribusi, terlihat SEMUA role, tapi tombol aksi verifikasi/terima/
tutup cuma render kalau `canManage=true`), `SwadayaContributionForm.tsx`
(form kontribusi, field berubah sesuai jenis dipilih), `SwadayaContributionActions.tsx`
+ `SwadayaCloseCampaignButton.tsx` (aksi Admin/Kepala Desa/Sekdes). Halaman
baru `/dashboard/public/swadaya` ("Bantu Warga Lain" — daftar semua
campaign `open` lintas laporan) dan `/dashboard/public/swadaya/[campaignId]`
(detail + form kontribusi), ditautkan dari navigasi warga. Foto bukti
serah-terima disimpan dengan pola identik 4 lokasi upload yang sudah ada:
`public/uploads/swadaya/<campaign_id>/<contribution_id>/<uuid>.<ext>`.
**Refactor pendukung** (logika TIDAK diubah, cuma dipindah supaya bisa
dipakai ulang tanpa duplikasi): `extendDueDateByPauseWindow` dipindah dari
`village/actions.ts` (privat) ke `src/lib/sla.ts` (exported); `hasReportProgressUpdates`
dipindah ke `src/features/reports/helpers.ts` — keduanya dipakai lagi oleh
`closeSwadayaCampaign` untuk resume SLA dengan basis timestamp
`SwadayaCampaign.openedAt/closedAt`, pola identik dengan resume SLA
anggaran biasa.

**Bug ditemukan & diperbaiki saat verifikasi Tugas 5** (bukan bagian asli
Cabang 5, ditemukan sambil kerja): kartu statistik agregat "Jeda Anggaran"
di halaman Monitoring SLA (`village/sla/page.tsx`) — beda dari badge
PER-BARIS yang sudah benar membedakan sumber jeda — ternyata masih
menjumlahkan SEMUA laporan `waiting_budget` sebagai "anggaran" tanpa
peduli sumbernya, celah yang terlewat saat mengerjakan Tugas 2 karena
fokusnya waktu itu cuma ke badge per-baris. Diperbaiki dengan memecah jadi
2 kartu terpisah ("Jeda Anggaran" dan "Jeda Swadaya") memakai data yang
sama yang sudah di-fetch di halaman itu.

**Diverifikasi dengan data nyata lewat browser (Playwright), alur penuh
ujung-ke-ujung**: laporan uji diklasifikasi ke Seksi Pembangunan → login
Kasi, ajukan anggaran Rp500.000 lewat form asli → login Kepala Desa
(akun permanen), tolak anggaran → dikonfirmasi laporan pindah
`handled_by_village` dan `resolutionDueAt` di-extend → buka Galang
Swadaya TANPA mengisi target manual → dikonfirmasi laporan balik
`waiting_budget`, target otomatis Rp500.000 muncul (dari budget request
yang BARU SAJA ditolak), badge watchlist menampilkan "Jeda Swadaya" bukan
"Jeda Anggaran" → login warga LAIN, kirim kontribusi uang (Rp200.000) DAN
tenaga lewat "Bantu Warga Lain" → dikonfirmasi `contributorId`/`Name`
otomatis dari sesi, tidak bisa diisi bebas → login Kepala Desa lagi,
verifikasi kedua kontribusi → konfirmasi terima salah satu dengan foto
bukti sungguhan (dikonfirmasi file benar-benar tersimpan di disk) → tutup
campaign → dikonfirmasi campaign `closed`, laporan lanjut
`handled_by_village`, `resolutionDueAt` di-extend LAGI (basis waktu
campaign kali ini), badge watchlist kembali normal. Total 30 assertion,
semua lolos di percobaan final (2 iterasi sebelumnya gagal karena bug di
SKRIP PLAYWRIGHT SAYA SENDIRI — salah asumsi lokasi tombol reject anggaran
ada di halaman detail per-request bukan inline tabel, dan locator berbasis
teks yang salah tangkap elemen lain karena pencocokan case-insensitive
Playwright kebetulan tertimpa isi catatan status log — bukan bug
aplikasi). Data uji dibersihkan total (2 akun, 1 laporan, 1 campaign, 2
kontribusi, 1 budget request, folder foto bukti) — database kembali ke
baseline persis: 13 profil, 84 laporan (83 demo + 1 asli), 0
campaign/kontribusi/budget request tersisa.

## Aturan Kerja untuk Claude Code

1. Jangan ubah logika bisnis apapun saat sesi ini masih tahap "refactor" —
   murni reorganisasi file, verifikasi dengan cara apapun yang meyakinkan
   (diff manual per fungsi, tsc + build) bahwa tidak ada perubahan
   perilaku. Progres refactor HANYA dianggap selesai kalau filenya
   benar-benar ada di working tree saat ini — jangan percaya checklist di
   bagian "Progres Sejauh Ini" tanpa cek ulang (`ls`/`Glob`), lihat catatan
   insiden admin/actions di atas.
2. Selalu jalankan `npx tsc --noEmit` dan `npm run build` setelah tiap
   perubahan file besar, sebelum lanjut ke file berikutnya.
3. Kerjakan satu file besar per giliran, laporkan hasilnya (jumlah baris
   tiap file baru, status build), baru lanjut kalau diminta.
4. Kalau ragu soal keputusan arsitektur yang belum tercatat di sini,
   tanyakan ke pengguna dulu daripada berasumsi — banyak keputusan (nama
   enum, struktur tabel baru, dsb) sudah dibahas panjang di luar sesi ini.
5. **Selama fase swap data layer (MySQL/Prisma untuk identitas vs Supabase
   untuk sisa data bisnis masih berjalan paralel), `npx tsc --noEmit` dan
   `npm run build` TIDAK CUKUP untuk menganggap sesuatu "beres"** — lihat
   insiden Settings di atas: keduanya lolos bersih padahal halaman itu
   crash runtime begitu dibuka, karena bug-nya soal ID dari database yang
   berbeda tidak nyambung, bukan soal tipe TypeScript. Kalau perubahan
   menyentuh query yang bergantung pada identitas user (apapun yang query
   balik ke `profiles` atau pakai `profile.id`/`session.user.id`), verifikasi
   dengan smoke test nyata (seed 1 user uji, jalankan dev server, coba akses
   halaman/alur terkait sungguhan lewat curl atau browser, baru bersihkan
   data ujinya) — bukan cuma percaya build lolos.
6. **Format pelaporan tugas (menggantikan "Penjelasan singkat" versi lama,
   karena formatnya kurang jelas)**: untuk SETIAP tugas
   bernomor/berlabel dalam satu prompt (Tugas 1/2/3 atau Tugas A/B/C/dst),
   laporkan TERPISAH per tugas — jangan digabung jadi satu ringkasan besar
   di akhir semua tugas. Tiap tugas dapat blok laporannya sendiri, ditulis
   segera setelah tugas itu selesai, dengan format:

   ```
   ## Tugas [label] — [nama singkat]
   **Dikerjakan:** apa saja yang benar-benar diubah/dibuat/dicek (bahasa
   sederhana, bukan jargon berat)
   **Hasil:** apa buktinya berhasil (build lulus? test lulus? dicoba manual
   di browser?) — sebutkan spesifik, jangan cuma "berhasil"
   **Kurang/belum lengkap:** apa yang SENGAJA belum disentuh, atau risiko
   yang masih ada meski tugas ini "selesai" — kalau benar-benar tidak ada
   yang kurang, tulis eksplisit "tidak ada catatan"
   ```

   Alasan: pengguna adalah mahasiswa yang akan sidang TA ini — dia harus
   benar-benar paham sistemnya sendiri untuk bisa menjawab pertanyaan
   penguji, bukan cuma menerima laporan teknis tanpa konteks yang dia
   sendiri tidak bisa jelaskan ulang. Format lama ("Penjelasan singkat"
   2-4 kalimat bebas di akhir tugas) tidak cukup jelas soal APA yang jadi
   bukti keberhasilan vs APA yang sengaja dilewati — format baru ini
   memaksa ketiga hal itu (dikerjakan/hasil/kurang) selalu eksplisit dan
   terpisah per tugas, bukan tercampur di satu paragraf.

   **Kasus khusus — laporan berbasis daftar temuan** (misal sapuan/audit
   yang hasilnya satu daftar berisi banyak titik, bukan satu deliverable
   tunggal): laporkan per LOKASI TEMUAN, bukan per tugas, dengan format:

   ```
   ## [nama file : nama fungsi/halaman]
   **Dipakai untuk apa:** ...
   **Dampak kalau dibiarkan:** ...
   **Seberapa sering halaman ini diakses:** (staf desa saja / staf +
   masyarakat umum / jarang dipakai / dst)
   **Rekomendasi saya kalau ada:** (opsional, boleh dikosongkan kalau
   tidak yakin)
   ```

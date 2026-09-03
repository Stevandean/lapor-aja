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

### Cabang 1 — Deteksi & Klasifikasi Waktu
- 1a. Klasifikasi status waktu otomatis: 4 level **Aman → Peringatan → Kritis
  → Terlambat** (saat ini kode cuma punya on_time/at_risk/overdue, PERLU
  ditambah level "critical" di antara at_risk dan overdue)
- 1b. Ambang batas SLA per kategori laporan (saat ini SLA cuma berbasis
  priority via tabel `sla_rules`, belum ada override per kategori)
- 1c. Perhitungan SLA berbasis hari kerja (mengecualikan akhir pekan/libur)

### Cabang 2 — Notifikasi & Eskalasi
- 2a. Notifikasi bertingkat sesuai level eskalasi: level 1 → Kasi
  penanggung jawab, level 2 → +Admin, level 3 → +Kepala Desa (saat ini
  notifikasi FLAT broadcast ke admin+kepala_desa+sekdes untuk semua alert,
  Kasi malah TIDAK termasuk penerima — ini bug/gap nyata yang harus diperbaiki)
- 2b. Daftar laporan berisiko (watchlist) — halaman kerja harian, filter per
  dusun/kategori/penanggung jawab

### Cabang 3 — Evaluasi Kinerja (belum ada sama sekali di kode)
- 3a. Dashboard evaluasi kinerja per periode (persentase tepat waktu vs
  terlambat, tren antar periode)
- 3b. Dashboard evaluasi kinerja per dusun & kategori
- 3c. Predikat kinerja terbaik (badge otomatis per Kasi/dusun/kategori,
  syarat minimum jumlah laporan supaya adil, framing apresiasi bukan
  kompetisi)

### Cabang 4 — Transparansi & Akuntabilitas
- 4a. Riwayat jejak waktu (audit trail) — SUDAH ADA via `report_status_logs`
  dan `report_sla_events`, tinggal dipastikan lengkap
- 4b. Ekspor laporan evaluasi kinerja berkala (PDF/Excel)
- 4c. Statistik kepatuhan SLA untuk publik (halaman ringkas terbuka warga)

### Cabang 5 — Percepatan Penyelesaian via Swadaya Masyarakat (fitur baru
total, insight dari wawancara narasumber)
- 5a. Pemicu otomatis galang swadaya saat laporan berstatus `waiting_budget`
  melewati ambang waktu tertentu, ATAU saat pengajuan anggaran ditolak
  (lihat `rejectBudgetRequest` di `src/features/village/actions.ts` — titik
  hook yang tepat)
- 5b. Kontribusi multi-jenis: **uang, material, logistik, tenaga** (bukan
  cuma uang) — catatan akademis: penelitian Kurniasih & Mulyono (2022) sudah
  singgung donasi/galang dana secara umum, jadi kebaruan kita ditekankan di
  multi-jenis kontribusinya, bukan konsep donasi itu sendiri
- 5c. Progres transparan per laporan (publik lihat total terkumpul + sisa
  kebutuhan)
- 5d. Validasi & pencairan oleh Admin/Kepala Desa sebelum dipakai

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
- [ ] Build 5 cabang fitur baru — belum, menunggu keputusan PDF surat
  resmi di atas diriset dan diputuskan dulu (semua landmine split-brain
  migrasi sudah tuntas, jadi ini sekarang murni soal fitur baru, bukan
  lagi soal database mana yang benar).

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

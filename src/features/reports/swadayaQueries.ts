import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@prisma/client";

// Cabang 5a/2b: dipakai halaman watchlist (Admin/Kasi/Village) untuk
// membedakan label badge "Jeda Anggaran" vs "Jeda Swadaya" pada laporan
// berstatus waiting_budget — SlaStatus/ReportStatus-nya SAMA (reuse
// mekanisme waiting_budget yang sudah ada, lihat rasionalisasi di
// CLAUDE.md), jadi satu-satunya cara membedakan sumber jeda adalah cek
// apakah laporan itu punya SwadayaCampaign yang masih `open`.
export async function getOpenSwadayaCampaignReportIds(): Promise<string[]> {
  const campaigns = await prisma.swadayaCampaign.findMany({
    where: { status: "open" },
    select: { reportId: true },
  });

  return campaigns.map((campaign) => campaign.reportId);
}

const campaignWithContributionsInclude = {
  openedByUser: { select: { fullName: true } },
  contributions: {
    orderBy: { createdAt: "desc" as const },
    include: {
      verifier: { select: { fullName: true } },
      receiver: { select: { fullName: true } },
    },
  },
};

type CampaignWithContributions = Prisma.SwadayaCampaignGetPayload<{
  include: typeof campaignWithContributionsInclude;
}>;

// Dipakai bersama oleh getSwadayaCampaignForReport/getSwadayaCampaignById
// supaya perhitungan target/terkumpul tidak dobel logikanya.
async function buildCampaignDetail(campaign: CampaignWithContributions) {
  // Keputusan 6: target dana pakai ReportBudgetRequest TERAKHIR untuk
  // laporan ini kalau ada (nilai numerik totalEstimatedBudget), fallback
  // ke targetNote bebas teks kalau tidak ada pengajuan anggaran sama
  // sekali.
  const latestBudgetRequest = await prisma.reportBudgetRequest.findFirst({
    where: { reportId: campaign.reportId },
    orderBy: { createdAt: "desc" },
    select: { totalEstimatedBudget: true },
  });

  const targetAmount = latestBudgetRequest
    ? Number(latestBudgetRequest.totalEstimatedBudget)
    : null;

  // "Terkumpul" dihitung dari kontribusi UANG yang statusnya sudah
  // verified/received saja — pending belum dianggap "terkumpul" karena
  // baru klaim sepihak dari kontributor, belum dikonfirmasi desa.
  const totalCollected = campaign.contributions
    .filter(
      (contribution) =>
        contribution.type === "uang" &&
        (contribution.status === "verified" || contribution.status === "received")
    )
    .reduce((sum, contribution) => sum + Number(contribution.amount ?? 0), 0);

  const totalPending = campaign.contributions
    .filter((contribution) => contribution.type === "uang" && contribution.status === "pending")
    .reduce((sum, contribution) => sum + Number(contribution.amount ?? 0), 0);

  return {
    id: campaign.id,
    reportId: campaign.reportId,
    status: campaign.status,
    targetNote: campaign.targetNote,
    targetAmount,
    totalCollected,
    totalPending,
    openedAt: campaign.openedAt.toISOString(),
    openedByName: campaign.openedByUser?.fullName ?? null,
    closedAt: campaign.closedAt?.toISOString() ?? null,
    closedReason: campaign.closedReason,
    contributions: campaign.contributions.map((contribution) => ({
      id: contribution.id,
      contributorName: contribution.contributorName,
      contributorPhone: contribution.contributorPhone,
      type: contribution.type,
      amount: contribution.amount ? Number(contribution.amount) : null,
      itemDescription: contribution.itemDescription,
      itemQuantity: contribution.itemQuantity ? Number(contribution.itemQuantity) : null,
      itemUnit: contribution.itemUnit,
      availabilityNote: contribution.availabilityNote,
      status: contribution.status,
      verifiedByName: contribution.verifier?.fullName ?? null,
      verifiedAt: contribution.verifiedAt?.toISOString() ?? null,
      receivedByName: contribution.receiver?.fullName ?? null,
      receivedAt: contribution.receivedAt?.toISOString() ?? null,
      receivedNote: contribution.receivedNote,
      proofPhotoPath: contribution.proofPhotoPath,
      createdAt: contribution.createdAt.toISOString(),
    })),
  };
}

// Cabang 5a: dipakai tombol "Buka Galang Swadaya" untuk cek eligibilitas
// (sudah ada campaign open atau belum) dan oleh section "Swadaya" di
// halaman detail laporan (Cabang 5c/5d) untuk data lengkap campaign +
// kontribusinya.
export async function getSwadayaCampaignForReport(reportId: string) {
  const campaign = await prisma.swadayaCampaign.findFirst({
    where: { reportId },
    orderBy: { openedAt: "desc" },
    include: campaignWithContributionsInclude,
  });

  if (!campaign) {
    return null;
  }

  return buildCampaignDetail(campaign);
}

export type SwadayaCampaignDetail = NonNullable<
  Awaited<ReturnType<typeof getSwadayaCampaignForReport>>
>;

// Cabang 5b: dipakai halaman "Bantu Warga Lain" per-campaign untuk
// menampilkan konteks laporan + form kontribusi.
export async function getSwadayaCampaignById(campaignId: string) {
  const campaign = await prisma.swadayaCampaign.findUnique({
    where: { id: campaignId },
    include: {
      ...campaignWithContributionsInclude,
      report: {
        select: {
          id: true,
          reportNumber: true,
          title: true,
          status: true,
          category: { select: { name: true } },
          dusun: { select: { name: true } },
        },
      },
    },
  });

  if (!campaign) {
    return null;
  }

  const detail = await buildCampaignDetail(campaign);

  return {
    ...detail,
    report: {
      id: campaign.report.id,
      reportNumber: campaign.report.reportNumber,
      title: campaign.report.title,
      status: campaign.report.status,
      categoryName: campaign.report.category?.name ?? null,
      dusunName: campaign.report.dusun?.name ?? null,
    },
  };
}

export type SwadayaCampaignWithReport = NonNullable<
  Awaited<ReturnType<typeof getSwadayaCampaignById>>
>;

// Cabang 5b: daftar semua galang swadaya yang masih terbuka lintas
// laporan, untuk halaman "Bantu Warga Lain" di dashboard warga.
export async function getOpenSwadayaCampaigns() {
  const campaigns = await prisma.swadayaCampaign.findMany({
    where: { status: "open" },
    orderBy: { openedAt: "desc" },
    include: {
      report: {
        select: {
          id: true,
          reportNumber: true,
          title: true,
          category: { select: { name: true } },
          dusun: { select: { name: true } },
        },
      },
      contributions: { select: { type: true, amount: true, status: true } },
    },
  });

  return Promise.all(
    campaigns.map(async (campaign) => {
      const latestBudgetRequest = await prisma.reportBudgetRequest.findFirst({
        where: { reportId: campaign.reportId },
        orderBy: { createdAt: "desc" },
        select: { totalEstimatedBudget: true },
      });

      const targetAmount = latestBudgetRequest
        ? Number(latestBudgetRequest.totalEstimatedBudget)
        : null;

      const totalCollected = campaign.contributions
        .filter(
          (contribution) =>
            contribution.type === "uang" &&
            (contribution.status === "verified" || contribution.status === "received")
        )
        .reduce((sum, contribution) => sum + Number(contribution.amount ?? 0), 0);

      return {
        id: campaign.id,
        reportId: campaign.reportId,
        reportNumber: campaign.report.reportNumber,
        reportTitle: campaign.report.title,
        categoryName: campaign.report.category?.name ?? null,
        dusunName: campaign.report.dusun?.name ?? null,
        targetNote: campaign.targetNote,
        targetAmount,
        totalCollected,
        contributionCount: campaign.contributions.length,
        openedAt: campaign.openedAt.toISOString(),
      };
    })
  );
}

import { prisma } from "@/src/lib/prisma";

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

// Cabang 5a: dipakai tombol "Buka Galang Swadaya" untuk cek eligibilitas
// (sudah ada campaign open atau belum) dan oleh section "Swadaya" di
// halaman detail laporan (Cabang 5c/5d) untuk data lengkap campaign +
// kontribusinya.
export async function getSwadayaCampaignForReport(reportId: string) {
  const campaign = await prisma.swadayaCampaign.findFirst({
    where: { reportId },
    orderBy: { openedAt: "desc" },
    include: {
      openedByUser: { select: { fullName: true } },
      contributions: {
        orderBy: { createdAt: "desc" },
        include: {
          verifier: { select: { fullName: true } },
          receiver: { select: { fullName: true } },
        },
      },
    },
  });

  if (!campaign) {
    return null;
  }

  // Keputusan 6: target dana pakai ReportBudgetRequest TERAKHIR untuk
  // laporan ini kalau ada (nilai numerik totalEstimatedBudget), fallback
  // ke targetNote bebas teks kalau tidak ada pengajuan anggaran sama
  // sekali.
  const latestBudgetRequest = await prisma.reportBudgetRequest.findFirst({
    where: { reportId },
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

export type SwadayaCampaignDetail = NonNullable<
  Awaited<ReturnType<typeof getSwadayaCampaignForReport>>
>;

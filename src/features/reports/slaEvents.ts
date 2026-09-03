import { getProfile } from "@/src/lib/auth/getProfile";
import { prisma } from "@/src/lib/prisma";
import type { SlaEventType } from "@prisma/client";

type RecordSlaEventParams = {
  reportId: string;
  eventType: SlaEventType;
  previousResolutionDueAt?: string | null;
  newResolutionDueAt?: string | null;
  note?: string | null;
};

export async function recordSlaEvent({
  reportId,
  eventType,
  previousResolutionDueAt = null,
  newResolutionDueAt = null,
  note = null,
}: RecordSlaEventParams) {
  const profile = await getProfile();

  try {
    await prisma.reportSlaEvent.create({
      data: {
        reportId,
        eventType,
        previousResolutionDueAt: previousResolutionDueAt
          ? new Date(previousResolutionDueAt)
          : null,
        newResolutionDueAt: newResolutionDueAt
          ? new Date(newResolutionDueAt)
          : null,
        note,
        createdBy: profile?.id ?? null,
      },
    });
  } catch (error) {
    console.error(
      "Failed to record SLA event:",
      error instanceof Error ? error.message : error
    );
  }
}

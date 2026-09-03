"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";

export async function markNavbarNotificationsAsRead() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  await prisma.notification.updateMany({
    where: { userId: profile.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard");
}

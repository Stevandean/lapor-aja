import { prisma } from "@/src/lib/prisma";
import { getUser } from "@/src/lib/auth/getUser";
import type { UserProfile } from "@/src/types/profile";

export async function getProfile(): Promise<UserProfile | null> {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    full_name: profile.fullName,
    email: profile.email,
    phone_number: profile.phoneNumber,
    role: profile.role,
    dusun_id: profile.dusunId,
    section_id: profile.sectionId,
    avatar_url: profile.avatarUrl,
    notification_internal_enabled: profile.notificationInternalEnabled,
    notification_email_enabled: profile.notificationEmailEnabled,
    notification_whatsapp_enabled: profile.notificationWhatsappEnabled,
    is_active: profile.isActive,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  } as UserProfile;
}

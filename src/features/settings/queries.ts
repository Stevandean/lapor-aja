import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { ROUTES } from "@/src/lib/constants/routes";
import { createClient } from "@/src/lib/supabase/server";
import { prisma } from "@/src/lib/prisma";

export async function getSettingsProfile() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  const settingsProfile = await prisma.profile.findUnique({
    where: { id: profile.id },
    include: {
      dusun: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    },
  });

  if (!settingsProfile) {
    console.error("Failed to fetch settings profile: profile not found");
    redirect(ROUTES.LOGIN);
  }

  let avatarSignedUrl: string | null = null;

  if (settingsProfile.avatarUrl) {
    const supabase = await createClient();
    const { data: signedUrlData } = await supabase.storage
      .from("profile-avatars")
      .createSignedUrl(settingsProfile.avatarUrl, 60 * 60);

    avatarSignedUrl = signedUrlData?.signedUrl ?? null;
  }

  return {
    id: settingsProfile.id,
    full_name: settingsProfile.fullName,
    email: settingsProfile.email,
    phone_number: settingsProfile.phoneNumber,
    role: settingsProfile.role,
    dusun_id: settingsProfile.dusunId,
    section_id: settingsProfile.sectionId,
    avatar_url: settingsProfile.avatarUrl,
    is_active: settingsProfile.isActive,
    created_at: settingsProfile.createdAt.toISOString(),
    updated_at: settingsProfile.updatedAt.toISOString(),
    dusun: settingsProfile.dusun,
    section: settingsProfile.section,
    notification_internal_enabled: settingsProfile.notificationInternalEnabled,
    notification_email_enabled: settingsProfile.notificationEmailEnabled,
    notification_whatsapp_enabled: settingsProfile.notificationWhatsappEnabled,
    avatar_signed_url: avatarSignedUrl,
    notification_settings_available: true,
  };
}

import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { getNavbarNotifications } from "@/src/features/notifications/queries";
import { getProfile } from "@/src/lib/auth/getProfile";
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/src/lib/constants/routes";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  const notifications = await getNavbarNotifications(profile.id);
  const avatarSignedUrl = await getAvatarSignedUrl(profile.avatar_url);

  return (
    <DashboardShell
      profile={{ ...profile, avatar_signed_url: avatarSignedUrl }}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}

async function getAvatarSignedUrl(avatarPath: string | null) {
  if (!avatarPath) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("profile-avatars")
    .createSignedUrl(avatarPath, 60 * 60);

  return data?.signedUrl ?? null;
}

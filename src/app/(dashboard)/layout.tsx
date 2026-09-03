import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { getNavbarNotifications } from "@/src/features/notifications/queries";
import { getProfile } from "@/src/lib/auth/getProfile";
import { redirect } from "next/navigation";
import { ROUTES } from "@/src/lib/constants/routes";

function toDisplayUrl(filePath: string | null | undefined) {
  return filePath && filePath.startsWith("/") ? filePath : null;
}

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
  const avatarSignedUrl = toDisplayUrl(profile.avatar_url);

  return (
    <DashboardShell
      profile={{ ...profile, avatar_signed_url: avatarSignedUrl }}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}

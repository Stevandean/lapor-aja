import { redirect } from "next/navigation";
import { CreateReportEntry } from "@/src/features/reports/components/CreateReportEntry";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole } from "@/src/lib/constants/routes";

export default async function CreateReportPage() {
  const profile = await getProfile();

  if (profile && profile.role !== "public") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return (
    <main className="min-h-screen bg-background">
      <CreateReportEntry isAuthenticated={Boolean(profile)} />
    </main>
  );
}

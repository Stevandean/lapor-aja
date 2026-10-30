import { getPublicSlaComplianceStats } from "@/src/features/public/queries";
import { PublicSlaView } from "@/src/features/public/components/PublicSlaView";

export const dynamic = "force-dynamic";

type DashboardPublicSlaPageProps = {
  searchParams?: Promise<{ demo?: string }>;
};

export default async function DashboardPublicSlaPage({
  searchParams,
}: DashboardPublicSlaPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const includeDemo = params?.demo === "1" || params?.demo === "true";

  const stats = await getPublicSlaComplianceStats({
    includeDemo,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PublicSlaView stats={stats} isDashboardView={true} />
    </div>
  );
}


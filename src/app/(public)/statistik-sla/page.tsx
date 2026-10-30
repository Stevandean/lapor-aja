import { getPublicSlaComplianceStats } from "@/src/features/public/queries";
import { PublicSlaView } from "@/src/features/public/components/PublicSlaView";

export const dynamic = "force-dynamic";

  type PublicSlaPageProps = {
    searchParams?: Promise<{ demo?: string }>;
  };

          export default async function PublicSlaStatisticsPage({
            searchParams,
}: PublicSlaPageProps) {
  const params = searchParams ? await searchParams : undefined;
          const includeDemo = params?.demo === "1" || params?.demo === "true";

          const stats = await getPublicSlaComplianceStats({
            includeDemo,
  });

        return (
        <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <PublicSlaView stats={stats} isDashboardView={false} />
          </div>
        </main>
        );
}

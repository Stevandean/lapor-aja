"use client";

import { useRouter } from "next/navigation";
import { CreateReportModal } from "@/src/features/reports/components/CreateReportModal";
import { ROUTES } from "@/src/lib/constants/routes";

type CreateReportEntryProps = {
  isAuthenticated?: boolean;
};

/**
 * Pintu masuk halaman /reports/create: membuka modal pembuatan laporan yang
 * sama dengan yang ada di dasbor warga, lalu mengarahkan pengguna kembali ke
 * halaman asal (beranda publik atau dasbor warga) saat modal ditutup.
 */
export function CreateReportEntry({
  isAuthenticated = false,
}: CreateReportEntryProps) {
  const router = useRouter();

  return (
    <CreateReportModal
      defaultOpen
      hideTrigger
      onClose={() =>
        router.push(isAuthenticated ? ROUTES.PUBLIC_DASHBOARD : ROUTES.HOME)
      }
      onSuccess={() =>
        router.push(
          isAuthenticated ? `${ROUTES.PUBLIC_DASHBOARD}/reports` : ROUTES.HOME
        )
      }
    />
  );
}

"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { ROUTES } from "@/src/lib/constants/routes";
import { cn } from "@/src/lib/utils";

type LogoutButtonProps = {
  className?: string;
  showIcon?: boolean;
  label?: string;
};

export function LogoutButton({
  className,
  showIcon = true,
  label = "Keluar",
}: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    const result = await signOut({ redirect: false });

    if (!result) {
      toast.error("Gagal keluar", {
        description: "Terjadi kesalahan saat keluar dari akun.",
      });
      return;
    }

    toast.success("Berhasil keluar", {
      description: "Anda sudah keluar dari akun.",
    });

    router.replace(ROUTES.LOGIN);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className={cn("justify-start", className)}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}

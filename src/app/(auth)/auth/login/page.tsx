import { Suspense } from "react";
import LoginForm from "@/src/features/auth/components/LoginForm";
import { AuthLayout } from "@/src/features/auth/components/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Selamat datang kembali"
      description="Masuk untuk mengirim laporan, memantau progress, dan mendukung layanan desa yang transparan."
      footerText="Belum punya akun?"
      footerLinkText="Buat akun"
      footerHref="/auth/register"
      secondaryLink={{
        text: "Lihat statistik kepatuhan SLA desa (tanpa perlu login)",
        href: "/statistik-sla",
      }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}

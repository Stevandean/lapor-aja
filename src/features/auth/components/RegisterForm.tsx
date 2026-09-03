"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/src/lib/constants/routes";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { registerUser } from "@/src/features/auth/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export default function RegisterForm() {
  const router = useRouter();

  const [state, action, isPending] = useActionState(
    registerUser,
    initialState
  );

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Registrasi berhasil", {
        description: "Silakan masuk menggunakan akun baru Anda.",
      });

      router.replace(`${ROUTES.LOGIN}?registered=1`);
      router.refresh();
    }

    if (state.status === "error") {
      toast.error("Registrasi gagal", {
        description: state.message,
      });
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-5">
      <div className="relative">
        <Input
          label="Nama lengkap"
          type="text"
          name="full_name"
          placeholder="Masukkan nama lengkap"
          required
          className="pl-10"
        />
        <User className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
      </div>

      <div className="relative">
        <Input
          label="Alamat email"
          type="email"
          name="email"
          placeholder="nama@email.com"
          required
          className="pl-10"
        />
        <Mail className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
      </div>

      <div className="relative">
        <Input
          label="Nomor HP"
          type="text"
          name="phone_number"
          placeholder="Contoh: 08123456789"
          className="pl-10"
        />
        <Phone className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
      </div>

      <div className="relative">
        <Input
          label="Kata sandi"
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Minimal 6 karakter"
          minLength={6}
          required
          className="pl-10 pr-10"
        />

        <Lock className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-[34px] rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={
            showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
          }
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Buat akun
      </Button>
    </form>
  );
}

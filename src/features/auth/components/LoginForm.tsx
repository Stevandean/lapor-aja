"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { loginUser } from "@/src/features/auth/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";

  const [state, action, isPending] = useActionState(loginUser, initialState);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!state.message || state.status !== "error") return;

    toast.error("Login gagal", {
      description: state.message,
    });
  }, [state]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="redirect_to" value={redirectParam} />

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
          label="Kata sandi"
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Masukkan kata sandi"
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
        Masuk
      </Button>
    </form>
  );
}

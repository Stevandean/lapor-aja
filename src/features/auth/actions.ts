"use server";

import bcrypt from "bcrypt";
import { AuthError } from "next-auth";
import { signIn } from "@/src/lib/auth/auth";
import { prisma } from "@/src/lib/prisma";
import { ROUTES } from "@/src/lib/constants/routes";
import type { ActionState } from "@/src/types/action";

export async function loginUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const redirectParam = String(formData.get("redirect_to") || "");
  const redirectTo = redirectParam.startsWith("/")
    ? redirectParam
    : ROUTES.DASHBOARD;

  if (!email || !password) {
    return {
      status: "error",
      message: "Email dan kata sandi wajib diisi.",
    };
  }

  const profile = await prisma.profile.findUnique({
    where: { email },
  });

  if (!profile) {
    return {
      status: "error",
      message: "Email atau kata sandi salah.",
    };
  }

  const passwordMatches = await bcrypt.compare(password, profile.passwordHash);

  if (!passwordMatches) {
    return {
      status: "error",
      message: "Email atau kata sandi salah.",
    };
  }

  if (!profile.isActive) {
    return {
      status: "error",
      message: "Akun Anda telah dinonaktifkan. Silakan hubungi administrator.",
    };
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        status: "error",
        message: "Login gagal. Silakan coba lagi.",
      };
    }

    throw error;
  }

  return {
    status: "success",
    message: "Login berhasil.",
  };
}

export async function registerUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phoneNumber = String(formData.get("phone_number") || "").trim();
  const password = String(formData.get("password") || "");

  if (!fullName || !email || !password) {
    return {
      status: "error",
      message: "Lengkapi nama, email, dan kata sandi.",
    };
  }

  if (password.length < 6) {
    return {
      status: "error",
      message: "Kata sandi minimal 6 karakter.",
    };
  }

  const existingProfile = await prisma.profile.findUnique({
    where: { email },
  });

  if (existingProfile) {
    return {
      status: "error",
      message: "Email ini sudah terdaftar. Silakan masuk menggunakan akun tersebut.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.profile.create({
    data: {
      fullName,
      email,
      phoneNumber: phoneNumber || null,
      passwordHash,
      role: "public",
      isActive: true,
    },
  });

  return {
    status: "success",
    message: "Registrasi berhasil. Silakan masuk menggunakan akun baru Anda.",
  };
}

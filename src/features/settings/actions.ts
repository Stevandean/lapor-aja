"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { getProfile } from "@/src/lib/auth/getProfile";
import { ROUTES } from "@/src/lib/constants/routes";
import { createClient } from "@/src/lib/supabase/server";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

async function requireProfile() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  return profile;
}

function isValidAvatar(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

export async function updateOwnProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void _prevState;

  const profile = await requireProfile();
  const fullName = String(formData.get("full_name") || "").trim();
  const phoneNumber = String(formData.get("phone_number") || "").trim();
  const avatar = formData.get("avatar");

  if (!fullName) {
    return {
      status: "error",
      message: "Nama lengkap wajib diisi.",
    };
  }

  const supabase = await createClient();
  let avatarPath: string | null | undefined;

  if (avatar instanceof File && avatar.size > 0) {
    if (!isValidAvatar(avatar)) {
      return {
        status: "error",
        message: "Foto profil harus berformat JPG, PNG, atau WEBP.",
      };
    }

    if (avatar.size > MAX_AVATAR_SIZE) {
      return {
        status: "error",
        message: "Foto profil harus kurang dari 2MB.",
      };
    }

    const extension = avatar.name.split(".").pop() || "jpg";
    avatarPath = `${profile.id}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(avatarPath, avatar, {
        contentType: avatar.type,
        upsert: true,
      });

    if (uploadError) {
      return {
        status: "error",
        message:
          uploadError.message ||
          "Gagal mengunggah foto profil. Jalankan migration pengaturan terlebih dahulu.",
      };
    }
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      fullName,
      phoneNumber: phoneNumber || null,
      ...(avatarPath ? { avatarUrl: avatarPath } : {}),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return {
    status: "success",
    message: "Profil berhasil diperbarui.",
  };
}

export async function updateOwnPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void _prevState;

  const profile = await requireProfile();

  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (password.length < 8) {
    return {
      status: "error",
      message: "Kata sandi minimal 8 karakter.",
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Konfirmasi kata sandi tidak cocok.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.profile.update({
    where: { id: profile.id },
    data: { passwordHash },
  });

  return {
    status: "success",
    message: "Kata sandi berhasil diperbarui.",
  };
}

export async function updateNotificationPreferences(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void _prevState;

  const profile = await requireProfile();
  const internalEnabled = formData.get("notification_internal_enabled") === "on";
  const emailEnabled = formData.get("notification_email_enabled") === "on";
  const whatsappEnabled = formData.get("notification_whatsapp_enabled") === "on";

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      notificationInternalEnabled: internalEnabled,
      notificationEmailEnabled: emailEnabled,
      notificationWhatsappEnabled: whatsappEnabled,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return {
    status: "success",
    message: "Preferensi notifikasi berhasil diperbarui.",
  };
}

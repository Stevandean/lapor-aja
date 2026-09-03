"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { recordSlaEvent } from "@/src/features/reports/slaEvents";
import { notifyRoleInternal } from "@/src/features/reports/internalNotifications";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads", "verifications");

async function requireHamletHead() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "kepala_dusun") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

function isValidImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

export async function verifyReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireHamletHead();

  if (!profile.dusun_id) {
    return {
      status: "error",
      message: "Akun Anda belum ditugaskan ke dusun.",
    };
  }

  const reportId = String(formData.get("report_id") || "");
  const result = String(formData.get("result") || "");
  const verificationNote = String(formData.get("verification_note") || "").trim();

  const photos = formData
    .getAll("verification_photos")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (!reportId) {
    return {
      status: "error",
      message: "ID laporan tidak ditemukan.",
    };
  }

  if (result !== "valid" && result !== "invalid") {
    return {
      status: "error",
      message: "Pilih hasil verifikasi terlebih dahulu.",
    };
  }

  if (!verificationNote) {
    return {
      status: "error",
      message: "Tulis catatan verifikasi terlebih dahulu.",
    };
  }

  if (photos.length === 0) {
    return {
      status: "error",
      message: "Unggah minimal satu foto verifikasi.",
    };
  }

  if (photos.length > 5) {
    return {
      status: "error",
      message: "Anda hanya bisa mengunggah maksimal 5 foto verifikasi.",
    };
  }

  for (const photo of photos) {
    if (!isValidImage(photo)) {
      return {
        status: "error",
        message: "Hanya gambar JPG, PNG, dan WEBP yang diizinkan.",
      };
    }

    if (photo.size > 10 * 1024 * 1024) {
      return {
        status: "error",
        message: "Setiap foto harus kurang dari 10MB.",
      };
    }
  }

  const report = await prisma.report.findFirst({
    where: { id: reportId, dusunId: profile.dusun_id, status: "need_verification" },
    select: { id: true, reportNumber: true, title: true, dusunId: true, status: true },
  });

  if (!report) {
    return {
      status: "error",
      message:
        "Laporan tidak ditemukan, sudah diverifikasi, atau bukan penugasan dusun Anda.",
    };
  }

  const isValid = result === "valid";
  const newStatus = isValid ? "verified_valid" : "verified_invalid";

  let verification: { id: string };

  try {
    verification = await prisma.reportVerification.create({
      data: {
        reportId,
        verifiedBy: profile.id,
        isValid,
        verificationNote,
      },
      select: { id: true },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal menyimpan data verifikasi.",
    };
  }

  const verificationDir = path.join(UPLOADS_ROOT, reportId, verification.id);
  await fs.mkdir(verificationDir, { recursive: true });

  for (const photo of photos) {
    const extension = photo.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `/uploads/verifications/${reportId}/${verification.id}/${fileName}`;
    const absolutePath = path.join(verificationDir, fileName);

    try {
      const buffer = Buffer.from(await photo.arrayBuffer());
      await fs.writeFile(absolutePath, buffer);
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal menyimpan foto verifikasi.",
      };
    }

    try {
      await prisma.verificationPhoto.create({
        data: {
          verificationId: verification.id,
          filePath,
          photoUrl: filePath,
        },
      });
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal menyimpan data foto verifikasi.",
      };
    }
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        ...(!isValid ? { slaStatus: "completed" } : {}),
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal memperbarui status laporan.",
    };
  }

  await createReportStatusLog({
    reportId,
    oldStatus: "need_verification",
    newStatus,
    note: isValid
      ? "Laporan diverifikasi valid oleh kepala dusun."
      : "Laporan diverifikasi tidak valid oleh kepala dusun.",
  });

  if (!isValid) {
    await recordSlaEvent({
      reportId,
      eventType: "completed",
      note: "SLA selesai karena laporan diverifikasi tidak valid.",
    });
  }

  await notifyRoleInternal({
    roles: ["admin"],
    reportId,
    subject: `Verifikasi selesai ${report.reportNumber}`,
    message: `Kepala dusun telah memverifikasi laporan ${report.reportNumber} (${report.title}) sebagai ${isValid ? "valid" : "tidak valid"}. Catatan: ${verificationNote}`,
  });

  revalidatePath("/dashboard/hamlet-head/verification");
  revalidatePath(`/dashboard/hamlet-head/verification/${reportId}`);
  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);

  return {
    status: "success",
    message:
      result === "valid"
        ? "Laporan berhasil diverifikasi valid."
        : "Laporan berhasil diverifikasi tidak valid.",
  };
}

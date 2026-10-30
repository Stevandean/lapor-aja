"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/src/lib/prisma";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole } from "@/src/lib/constants/routes";
import { createReportStatusLog } from "@/src/features/reports/statusLogs";
import { ActionState } from "@/src/types/action";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads", "reports");
const ANONYMOUS_CITIZEN_EMAIL = "warga.anonim@lapor-aja.local";

async function resolveReporterProfileId() {
  const profile = await getProfile();

  if (profile) {
    if (profile.role !== "public") {
      redirect(getDashboardRouteByRole(profile.role));
    }

    return profile.id;
  }

  const existingAnonymous = await prisma.profile.findUnique({
    where: { email: ANONYMOUS_CITIZEN_EMAIL },
    select: { id: true },
  });

  if (existingAnonymous) {
    return existingAnonymous.id;
  }

  const createdAnonymous = await prisma.profile.create({
    data: {
      fullName: "Masyarakat Umum",
      email: ANONYMOUS_CITIZEN_EMAIL,
      passwordHash: "$2a$10$anonymousReporterAccountNotForDirectLogin000000000",
      role: "public",
      isActive: true,
      notificationEmailEnabled: false,
      notificationWhatsappEnabled: false,
      notificationInternalEnabled: false,
    },
    select: { id: true },
  });

  return createdAnonymous.id;
}

function generateReportNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);

  return `LPR-${year}-${random}`;
}

function isValidImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

export async function createReport(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const reporterId = await resolveReporterProfileId();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const gpsLatitude = Number(formData.get("gps_latitude"));
  const gpsLongitude = Number(formData.get("gps_longitude"));
  const locationRadiusKm = Number(formData.get("location_radius_km") || 5);
  const autoAddress = String(formData.get("auto_address") || "").trim();
  const photos = formData
    .getAll("photos")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (!title || !description) {
    throw new Error("Lengkapi judul dan deskripsi laporan terlebih dahulu.");
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Pilih lokasi laporan terlebih dahulu.");
  }

  if (
    Number.isNaN(gpsLatitude) ||
    Number.isNaN(gpsLongitude) ||
    Number.isNaN(locationRadiusKm)
  ) {
    return {
      status: "error",
      message: "Lokasi GPS wajib digunakan terlebih dahulu.",
    };
  }

  const distanceFromGpsKm = calculateDistanceKm(
    gpsLatitude,
    gpsLongitude,
    latitude,
    longitude
  );

  if (distanceFromGpsKm > locationRadiusKm) {
    return {
      status: "error",
      message: `Lokasi laporan harus berada dalam radius ${locationRadiusKm} km dari lokasi GPS Anda.`,
    };
  }

  if (photos.length === 0) {
    throw new Error("Unggah minimal satu foto bukti.");
  }

  if (photos.length > 5) {
    throw new Error("Anda hanya bisa mengunggah maksimal 5 foto.");
  }

  for (const photo of photos) {
    if (!isValidImage(photo)) {
      throw new Error("Hanya gambar JPG, PNG, dan WEBP yang diizinkan.");
    }

    if (photo.size > 10 * 1024 * 1024) {
      throw new Error("Setiap foto harus kurang dari 10MB.");
    }
  }

  let report: { id: string };

  try {
    report = await prisma.report.create({
      data: {
        reportNumber: generateReportNumber(),
        reporterId,
        title,
        description,
        latitude,
        longitude,
        autoAddress: autoAddress || null,
        status: "pending",
        priority: "sedang",
        assetStatus: "belum_diketahui",
        authorityLevel: "belum_diketahui",
        followUpType: "belum_ditentukan",
      },
      select: { id: true },
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Gagal membuat laporan."
    );
  }

  const reportDir = path.join(UPLOADS_ROOT, report.id);
  await fs.mkdir(reportDir, { recursive: true });

  for (const photo of photos) {
    const extension = photo.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `/uploads/reports/${report.id}/${fileName}`;
    const absolutePath = path.join(reportDir, fileName);

    try {
      const buffer = Buffer.from(await photo.arrayBuffer());
      await fs.writeFile(absolutePath, buffer);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Gagal menyimpan foto laporan."
      );
    }

    try {
      await prisma.reportPhoto.create({
        data: {
          reportId: report.id,
          uploadedBy: reporterId,
          filePath,
          photoUrl: filePath,
        },
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Gagal menyimpan data foto laporan."
      );
    }
  }

  await createReportStatusLog({
    reportId: report.id,
    oldStatus: null,
    newStatus: "pending",
    note: "Laporan dikirim oleh masyarakat.",
    changedBy: reporterId,
  });

  revalidatePath("/");
  revalidatePath("/dashboard/public");
  revalidatePath("/dashboard/public/reports");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/reports");

  return {
    status: "success",
    message: "Laporan berhasil dikirim.",
  };
}

function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) {
  const earthRadiusKm = 6371;

  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

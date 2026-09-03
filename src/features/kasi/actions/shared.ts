import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";
import type { ActionState } from "@/src/types/action";
import type { ProgressStatus } from "@prisma/client";

const MAX_PROGRESS_PHOTOS = 5;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads", "progress");

type AssignedReport = {
  id: string;
  report_number: string;
  title: string;
  status: string;
  resolution_due_at: string | null;
  assigned_section_id: string | null;
};

export async function requireKasi() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "kasi") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

function isValidImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

export function getProgressPhotos(formData: FormData) {
  return formData
    .getAll("progress_photos")
    .filter((file): file is File => file instanceof File && file.size > 0);
}

export function validateProgressPhotos(photos: File[]): ActionState | null {
  if (photos.length > MAX_PROGRESS_PHOTOS) {
    return {
      status: "error",
      message: `Anda hanya bisa mengunggah maksimal ${MAX_PROGRESS_PHOTOS} foto progres.`,
    };
  }

  for (const photo of photos) {
    if (!isValidImage(photo)) {
      return {
        status: "error",
        message: "Hanya gambar JPG, PNG, dan WEBP yang diizinkan.",
      };
    }

    if (photo.size > MAX_PHOTO_SIZE) {
      return {
        status: "error",
        message: "Setiap foto progres harus kurang dari 10MB.",
      };
    }
  }

  return null;
}

export async function getAssignedReport(
  reportId: string,
  sectionId: string
): Promise<AssignedReport | null> {
  const report = await prisma.report.findFirst({
    where: { id: reportId, assignedSectionId: sectionId },
    select: {
      id: true,
      reportNumber: true,
      title: true,
      status: true,
      resolutionDueAt: true,
      assignedSectionId: true,
    },
  });

  if (!report) {
    return null;
  }

  return {
    id: report.id,
    report_number: report.reportNumber,
    title: report.title,
    status: report.status,
    resolution_due_at: report.resolutionDueAt?.toISOString() ?? null,
    assigned_section_id: report.assignedSectionId,
  };
}

async function saveProgressPhotosToDisk({
  reportId,
  progressUpdateId,
  userId,
  photos,
}: {
  reportId: string;
  progressUpdateId: string;
  userId: string;
  photos: File[];
}) {
  const progressDir = path.join(UPLOADS_ROOT, userId, reportId, progressUpdateId);
  await fs.mkdir(progressDir, { recursive: true });

  const savedPhotos: { progress_update_id: string; file_path: string; photo_url: string }[] = [];

  for (const photo of photos) {
    const extension = photo.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `/uploads/progress/${userId}/${reportId}/${progressUpdateId}/${fileName}`;
    const absolutePath = path.join(progressDir, fileName);

    try {
      const buffer = Buffer.from(await photo.arrayBuffer());
      await fs.writeFile(absolutePath, buffer);
    } catch (error) {
      return {
        status: "error" as const,
        message: error instanceof Error ? error.message : "Gagal menyimpan foto progres.",
        photos: [],
      };
    }

    savedPhotos.push({
      progress_update_id: progressUpdateId,
      file_path: filePath,
      photo_url: filePath,
    });
  }

  return {
    status: "success" as const,
    message: "",
    photos: savedPhotos,
  };
}

export async function saveProgressUpdate({
  reportId,
  userId,
  updateType,
  title,
  note,
  photos,
}: {
  reportId: string;
  userId: string;
  updateType: "progress" | "resolved";
  title: string;
  note: string;
  photos: File[];
}) {
  const progressUpdateId = crypto.randomUUID();
  const uploadResult = await saveProgressPhotosToDisk({
    reportId,
    progressUpdateId,
    userId,
    photos,
  });

  if (uploadResult.status === "error") {
    return {
      status: "error" as const,
      message: uploadResult.message,
    };
  }

  try {
    await prisma.reportProgressUpdate.create({
      data: {
        id: progressUpdateId,
        reportId,
        progressTitle: title,
        progressNote: note,
        progressStatus: updateType as ProgressStatus,
        createdBy: userId,
      },
    });
  } catch (error) {
    return {
      status: "error" as const,
      message: error instanceof Error ? error.message : "Gagal menyimpan update progres.",
    };
  }

  if (uploadResult.photos.length > 0) {
    try {
      await prisma.reportProgressPhoto.createMany({
        data: uploadResult.photos.map((photo) => ({
          progressUpdateId: photo.progress_update_id,
          filePath: photo.file_path,
          photoUrl: photo.photo_url,
        })),
      });
    } catch (error) {
      await prisma.reportProgressUpdate.delete({ where: { id: progressUpdateId } }).catch(() => {});

      return {
        status: "error" as const,
        message: error instanceof Error ? error.message : "Gagal menyimpan foto progres.",
      };
    }
  }

  return {
    status: "success" as const,
    message: "",
  };
}

export async function reportHasProgressUpdates(reportId: string) {
  const count = await prisma.reportProgressUpdate.count({
    where: { reportId },
  });

  return count > 0;
}

export function revalidateKasiReport(reportId: string) {
  revalidatePath("/dashboard/kasi");
  revalidatePath("/dashboard/kasi/reports");
  revalidatePath("/dashboard/kasi/history");
  revalidatePath("/dashboard/kasi/budget");
  revalidatePath(`/dashboard/kasi/reports/${reportId}`);
  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin/follow-up");
  revalidatePath("/dashboard/village/budget-requests");
}

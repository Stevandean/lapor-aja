import { prisma } from "@/src/lib/prisma";

export async function getReportFormOptions() {
  const [categories, hamlets] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.dusun.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    categories,
    hamlets,
  };
}

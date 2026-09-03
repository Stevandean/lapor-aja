import { getProfile } from "@/src/lib/auth/getProfile";
import { prisma } from "@/src/lib/prisma";

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  role: true,
  isActive: true,
  createdAt: true,
  dusun: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
} as const;

function mapUser(user: {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  dusun: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
}) {
  return {
    id: user.id,
    full_name: user.fullName,
    email: user.email,
    phone_number: user.phoneNumber,
    role: user.role,
    is_active: user.isActive,
    created_at: user.createdAt.toISOString(),
    dusun: user.dusun,
    section: user.section,
  };
}

export async function getVillageUsersData() {
  const profile = await getProfile();

  if (!profile || !["kepala_desa", "sekdes"].includes(profile.role)) {
    return {
      users: [],
      stats: {
        totalUsers: 0,
        publicUsers: 0,
        adminUsers: 0,
        hamletHeadUsers: 0,
        villageLeaders: 0,
      },
    };
  }

  const rows = await prisma.profile.findMany({
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });

  const users = rows.map(mapUser);

  return {
    users,
    stats: {
      totalUsers: users.length,
      publicUsers: users.filter((user) => user.role === "public").length,
      adminUsers: users.filter((user) => user.role === "admin").length,
      hamletHeadUsers: users.filter((user) => user.role === "kepala_dusun")
        .length,
      villageLeaders: users.filter((user) =>
        ["kepala_desa", "sekdes"].includes(user.role)
      ).length,
    },
  };
}

export async function getVillageUserDetail(userId: string) {
  const profile = await getProfile();

  if (!profile || !["admin", "sekdes", "kepala_desa"].includes(profile.role)) {
    return null;
  }

  const user = await prisma.profile.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      dusunId: true,
      sectionId: true,
      isActive: true,
      createdAt: true,
      dusun: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    full_name: user.fullName,
    email: user.email,
    phone_number: user.phoneNumber,
    role: user.role,
    dusun_id: user.dusunId,
    section_id: user.sectionId,
    is_active: user.isActive,
    created_at: user.createdAt.toISOString(),
    dusun: user.dusun,
    section: user.section,
  };
}

export async function getVillageUserFormOptions() {
  const profile = await getProfile();

  if (!profile || !["admin", "sekdes", "kepala_desa"].includes(profile.role)) {
    return {
      hamlets: [],
    };
  }

  const hamlets = await prisma.dusun.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    hamlets,
  };
}

export type VillageSectionOption = {
  id: string;
  name: string;
};

export async function getVillageSectionOptions() {
  return prisma.villageSection.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { prisma } from "@/src/lib/prisma";

async function requireMasterDataManager() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "admin") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

export async function getCategoryMasterData() {
  await requireMasterDataManager();

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    is_active: category.isActive,
    created_at: category.createdAt.toISOString(),
    updated_at: category.updatedAt.toISOString(),
  }));
}

export async function getDusunMasterData() {
  await requireMasterDataManager();

  const dusuns = await prisma.dusun.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return dusuns.map((dusun) => ({
    id: dusun.id,
    name: dusun.name,
    description: dusun.description,
    is_active: dusun.isActive,
    created_at: dusun.createdAt.toISOString(),
    updated_at: dusun.updatedAt.toISOString(),
  }));
}

export async function getAgencyMasterData() {
  await requireMasterDataManager();

  const agencies = await prisma.agency.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      contactPerson: true,
      phone: true,
      email: true,
      address: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return agencies.map((agency) => ({
    id: agency.id,
    name: agency.name,
    description: agency.description,
    contact_person: agency.contactPerson,
    phone: agency.phone,
    email: agency.email,
    address: agency.address,
    is_active: agency.isActive,
    created_at: agency.createdAt.toISOString(),
    updated_at: agency.updatedAt.toISOString(),
  }));
}

export async function getSlaRuleMasterData() {
  await requireMasterDataManager();

  const slaRules = await prisma.slaRule.findMany({
    select: {
      id: true,
      priority: true,
      verificationHours: true,
      resolutionHours: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { resolutionHours: "asc" },
  });

  return slaRules.map((rule) => ({
    id: rule.id,
    priority: rule.priority,
    verification_hours: rule.verificationHours,
    resolution_hours: rule.resolutionHours,
    description: rule.description,
    is_active: rule.isActive,
    created_at: rule.createdAt.toISOString(),
    updated_at: rule.updatedAt.toISOString(),
  }));
}

export type VillageSection = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export async function getVillageSections() {
  const sections = await prisma.villageSection.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      isActive: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return sections.map((section) => ({
    id: section.id,
    name: section.name,
    code: section.code,
    description: section.description,
    is_active: section.isActive,
    sort_order: section.sortOrder,
    created_at: section.createdAt.toISOString(),
    updated_at: section.updatedAt.toISOString(),
  }));
}

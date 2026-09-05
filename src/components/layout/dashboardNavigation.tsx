import {
  Archive,
  ArrowRightCircle,
  Award,
  BarChart3,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  HeartHandshake,
  Home,
  Map,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  Building2,
  Timer,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/src/types/profile";

export type DashboardNavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  children?: {
    label: string;
    href: string;
    icon: LucideIcon;
  }[];
};

export function getDashboardNavigation(role: UserRole): DashboardNavItem[] {
  const settingsItem = {
    label: "Pengaturan",
    href: "/dashboard/settings",
    icon: Settings,
  };

  if (role === "admin") {
    return [
      { label: "Beranda", href: "/dashboard/admin", icon: Home },
      {
        label: "Laporan",
        href: "/dashboard/admin/reports",
        icon: ClipboardList,
      },
      {
        label: "Klasifikasi Aset",
        href: "/dashboard/admin/asset-classification",
        icon: Database,
      },
      {
        label: "Tindak Lanjut",
        href: "/dashboard/admin/follow-up",
        icon: ArrowRightCircle,
      },
      {
        label: "Arsip",
        href: "/dashboard/admin/archive",
        icon: Archive,
      },
      {
        label: "Surat",
        href: "/dashboard/admin/letters",
        icon: FileText,
      },
      {
        label: "Data Master",
        icon: Database,
        children: [
          {
            label: "Kategori",
            href: "/dashboard/admin/master-data/categories",
            icon: Tags,
          },
          {
            label: "Dusun",
            href: "/dashboard/admin/master-data/dusuns",
            icon: Map,
          },
          {
            label: "Instansi",
            href: "/dashboard/admin/master-data/agencies",
            icon: Building2,
          },
          {
            label: "Seksi Desa",
            href: "/dashboard/admin/master-data/village-sections",
            icon: Users,
          },
          {
            label: "Aturan SLA",
            href: "/dashboard/admin/master-data/sla-rules",
            icon: Timer,
          },
        ],
      },
      settingsItem,
    ];
  }

  if (role === "kepala_dusun") {
    return [
      { label: "Beranda", href: "/dashboard/hamlet-head", icon: Home },
      {
        label: "Laporan",
        href: "/dashboard/hamlet-head/reports",
        icon: ClipboardList,
      },
      {
        label: "Verifikasi",
        href: "/dashboard/hamlet-head/verification",
        icon: ShieldCheck,
      },
      {
        label: "Riwayat",
        href: "/dashboard/hamlet-head/history",
        icon: Archive,
      },
      settingsItem,
    ];
  }

  if (role === "kepala_desa" || role === "sekdes") {
    return [
      { label: "Beranda", href: "/dashboard/village", icon: Home },
      {
        label: "Laporan",
        href: "/dashboard/village/reports",
        icon: ClipboardList,
      },
      {
        label: "Analitik",
        href: "/dashboard/village/analytics",
        icon: BarChart3,
      },
      {
        label: "Monitoring SLA",
        href: "/dashboard/village/sla",
        icon: Gauge,
      },
      {
        label: "Evaluasi Kinerja",
        href: "/dashboard/village/performance",
        icon: Award,
      },
      {
        label: "Pengajuan Anggaran",
        href: "/dashboard/village/budget-requests",
        icon: Wallet,
      },
      {
        label: "Heatmap",
        href: "/dashboard/village/heatmap",
        icon: Map,
      },
      {
        label: "Pengguna",
        href: "/dashboard/village/users",
        icon: Users,
      },
      {
        label: "Arsip",
        href: "/dashboard/village/archive",
        icon: Archive,
      },
      settingsItem,
    ];
  }

  if (role === "kasi") {
    return [
      { label: "Beranda", href: "/dashboard/kasi", icon: Home },
      {
        label: "Laporan Ditugaskan",
        href: "/dashboard/kasi/reports",
        icon: ClipboardList,
      },
      {
        label: "Pengajuan Anggaran",
        href: "/dashboard/kasi/budget",
        icon: Wallet,
      },
      {
        label: "Riwayat Progress",
        href: "/dashboard/kasi/history",
        icon: Archive,
      },
      settingsItem,
    ];
  }

  return [
    {
      label: "Beranda",
      href: "/dashboard/public",
      icon: Home,
    },
    {
      label: "Laporan Saya",
      href: "/dashboard/public/reports",
      icon: ClipboardList,
    },
    {
      label: "Bantu Warga Lain",
      href: "/dashboard/public/swadaya",
      icon: HeartHandshake,
    },
    settingsItem,
  ];
}

export type UserRole =
  | "public"
  | "admin"
  | "kepala_desa"
  | "sekdes"
  | "kepala_dusun"
  | "kasi";

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  dusun_id: string | null;
  section_id: string | null;
  avatar_url: string | null;
  avatar_signed_url?: string | null;
  notification_internal_enabled: boolean;
  notification_email_enabled: boolean;
  notification_whatsapp_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
